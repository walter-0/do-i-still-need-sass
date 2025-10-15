/**
 * @file Migration scoring algorithm
 * Calculates migration difficulty scores based on Sass feature usage
 * @module migration/scorer
 */

/**
 * @import {DetectionResults, MigrationScore, RecommendationType, MigrationDifficulty, MigrationBlocker} from '@/types'
 */

/**
 * Calculate migration score from 0-100
 * Higher scores = easier migration
 *
 * SCORING PHILOSOPHY: Conservative estimates to minimize risk.
 * Engineering complexity does NOT scale linearly - we use exponential penalties
 * for blocker features to reflect real-world migration difficulty.
 *
 * - 80-100: Easy - Most features have CSS equivalents
 * - 50-79: Moderate - Hybrid approach recommended
 * - 20-49: Difficult - Keep most Sass
 * - 0-19: Keep Sass - Too many blockers
 *
 * @param {DetectionResults} features - Detected Sass features
 * @param {object} [options] - Scoring options
 * @param {object} [options.weights] - Custom weights for different categories
 * @returns {MigrationScore} Score breakdown
 */
export function calculateMigrationScore(features, options = {}) {
  const weights = {
    variables: options.weights?.variables ?? 1.0,
    nesting: options.weights?.nesting ?? 1.5,
    complexity: options.weights?.complexity ?? 2.0,
    blockers: options.weights?.blockers ?? 5.0, // Heavily weight blockers
  };

  // Score each category (0-100)
  const variablesScore = scoreVariables(features);
  const nestingScore = scoreNesting(features);
  const complexityScore = scoreComplexity(features);
  const blockersScore = scoreBlockers(features);

  // Apply weights
  const weightedVariables = variablesScore * weights.variables;
  const weightedNesting = nestingScore * weights.nesting;
  const weightedComplexity = complexityScore * weights.complexity;
  const weightedBlockers = blockersScore * weights.blockers;

  // Calculate weighted average
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let weightedAverage = (weightedVariables + weightedNesting + weightedComplexity + weightedBlockers) / totalWeight;

  // Apply exponential penalty for multiple blocker types (risk compounds)
  const blockerTypeCount = countBlockerTypes(features);
  const exponentialPenalty = blockerTypeCount > 1 ? Math.pow(blockerTypeCount, 1.5) * 5 : 0;

  // CRITICAL: If ANY category scores below 50, cap the overall score
  // This prevents high scores in easy categories from masking critical migration blockers
  const minCategoryScore = Math.min(variablesScore, nestingScore, complexityScore, blockersScore);
  if (minCategoryScore < 50) {
    // Cap overall score based on the lowest category
    // Example: if blockers = 20, overall can't exceed 65
    const maxAllowed = minCategoryScore + 45;
    weightedAverage = Math.min(weightedAverage, maxAllowed);
  }

  const overall = Math.max(0, Math.round(weightedAverage - exponentialPenalty));

  return {
    overall,
    breakdown: {
      variables: Math.round(variablesScore),
      nesting: Math.round(nestingScore),
      complexity: Math.round(complexityScore),
      blockers: Math.round(blockersScore),
    },
  };
}

/**
 * Count number of different blocker types present
 * Used for exponential penalty calculation
 * @param {DetectionResults} features
 * @returns {number}
 */
function countBlockerTypes(features) {
  let count = 0;
  if (features.controlFlow.count > 0) count++;
  if (features.mixins.definitions > 0) count++;
  if (features.functions.definitions > 0) count++;
  if (features.builtInModules.count > 0) count++;
  if (features.interpolation.count > 0) count++;
  return count;
}

/**
 * Score variables (0-100)
 * Variables are easy to migrate to CSS custom properties
 * @param {DetectionResults} features
 * @returns {number}
 */
function scoreVariables(features) {
  const count = features.variables.count;

  if (count === 0) {
    return 100; // No variables = perfect score
  }

  // Variables are easy to migrate, so even lots of them score well
  // Deduct 5 points per 10 variables, minimum 70
  const deduction = Math.floor(count / 10) * 5;
  return Math.max(70, 100 - deduction);
}

/**
 * Score nesting (0-100)
 * Native CSS nesting is now available, but deep nesting is still complex
 * Uses exponential penalty for depth to reflect real refactoring difficulty
 * @param {DetectionResults} features
 * @returns {number}
 */
function scoreNesting(features) {
  const count = features.nesting.count;
  const maxDepth = features.nesting.maxDepth;

  if (count === 0) {
    return 100; // No nesting = perfect score
  }

  let score = 100;

  // Exponential depth penalties (complexity compounds with depth)
  if (maxDepth <= 2) {
    score = 95; // Shallow nesting - native CSS handles this fine
  } else if (maxDepth === 3) {
    score = 75; // Moderate depth - still manageable
  } else if (maxDepth === 4) {
    score = 50; // Deep nesting - refactoring gets complex
  } else if (maxDepth === 5) {
    score = 30; // Very deep - significant refactoring needed
  } else {
    // 6+ levels: exponential penalty
    score = Math.max(10, 30 - (maxDepth - 5) * 5);
  }

  // Volume penalty (lots of nested rules = lots of refactoring)
  // More aggressive: each 3 nested rules reduces score
  const volumeDeduction = Math.min(20, Math.floor(count / 3) * 4);
  score -= volumeDeduction;

  return Math.max(0, score);
}

/**
 * Score complexity features (parent selector, interpolation, etc.)
 * These features add significant migration complexity
 * @param {DetectionResults} features
 * @returns {number}
 */
function scoreComplexity(features) {
  let score = 100;

  // Parent selector (&) - native CSS supports basic usage
  if (features.parentSelector.count > 0) {
    // Basic parent selector usage is fine
    score -= 3;
    // Advanced usage (BEM patterns like &__element) requires manual refactoring
    if (features.parentSelector.advancedUsage > 0) {
      score -= features.parentSelector.advancedUsage * 8;
    }
  }

  // Interpolation - NO direct CSS equivalent, must be hardcoded
  if (features.interpolation.count > 0) {
    // Conservative: each interpolation requires manual expansion
    score -= features.interpolation.count * 15;
    // Exponential penalty for heavy interpolation use
    if (features.interpolation.count > 3) {
      score -= Math.pow(features.interpolation.count - 3, 1.2) * 3;
    }
  }

  // Operators - calc() can replace most, but needs review
  if (features.operators.count > 0) {
    score -= features.operators.count * 4;
  }

  // Color functions - limited CSS equivalents (color-mix, but browser support varies)
  if (features.colorFunctions.count > 0) {
    // Conservative: assume manual conversion needed
    score -= features.colorFunctions.count * 12;
    // Multiple color functions = design system dependency
    if (features.colorFunctions.count > 2) {
      score -= 8;
    }
  }

  // @extend - no CSS equivalent, must refactor to classes or duplication
  if (features.extend.count > 0) {
    score -= features.extend.count * 15;
  }

  // Placeholders - tied to @extend, no CSS equivalent
  if (features.placeholders.count > 0) {
    score -= features.placeholders.count * 15;
  }

  // Maps - no CSS equivalent (would need to be hardcoded)
  if (features.maps.count > 0) {
    score -= features.maps.count * 12;
    // Multiple maps = complex data structure dependency
    if (features.maps.count > 1) {
      score -= 10;
    }
  }

  // Lists - limited CSS equivalents
  if (features.lists.count > 0) {
    score -= features.lists.count * 8;
  }

  return Math.max(0, score);
}

/**
 * Score blockers (features with no CSS equivalent)
 * CONSERVATIVE APPROACH: These features have NO direct CSS equivalent.
 * Heavily penalize to reflect true migration difficulty.
 * @param {DetectionResults} features
 * @returns {number}
 */
function scoreBlockers(features) {
  let score = 100;

  // Control flow - CRITICAL blocker, no CSS equivalent
  // Each control flow statement represents programmatic generation that must be manually rewritten
  const totalControlFlow = features.controlFlow.count;
  if (totalControlFlow > 0) {
    // Base penalty: first control flow statement is devastating
    score -= 35;
    // Additional statements compound exponentially
    score -= Math.min(50, totalControlFlow * 15 + Math.pow(totalControlFlow, 1.3) * 5);
  }

  // Mixin definitions - MAJOR blocker
  // Distinguish between simple (no params) and complex (with params)
  if (features.mixins.definitions > 0) {
    // Assume if there are any mixin usages, they're likely parameterized
    const hasParameters = features.mixins.usages > 0;
    if (hasParameters) {
      // Parameterized mixins = no CSS equivalent at all
      score -= features.mixins.definitions * 30;
    } else {
      // Simple mixins can be converted to classes (still work though)
      score -= features.mixins.definitions * 20;
    }
  }

  // Function definitions - MAJOR blocker
  if (features.functions.definitions > 0) {
    // Custom functions have NO CSS equivalent
    score -= features.functions.definitions * 30;
    // Exponential penalty for multiple functions (system dependency)
    if (features.functions.definitions > 1) {
      score -= Math.pow(features.functions.definitions, 1.3) * 4;
    }
  }

  // Built-in modules - STRONG blocker
  if (features.builtInModules.count > 0) {
    // Each module represents sophisticated Sass features
    score -= features.builtInModules.count * 25;
    // Extra penalty if using math (indicates complex calculations)
    if (features.builtInModules.modules.includes('sass:math')) {
      score -= 10;
    }
    // Extra penalty if using color manipulation
    if (features.builtInModules.modules.includes('sass:color')) {
      score -= 10;
    }
  }

  // Mixin/function usages compound the problem
  if (features.mixins.usages > 0) {
    // Each usage must be manually refactored
    score -= Math.min(25, features.mixins.usages * 3);
  }
  if (features.functions.usages > 0) {
    // Function calls must be replaced with static values or calc()
    score -= Math.min(25, features.functions.usages * 3);
  }

  return Math.max(0, score);
}

/**
 * Get migration recommendation based on score
 * @param {number} score - Overall migration score (0-100)
 * @returns {RecommendationType}
 */
export function getRecommendationType(score) {
  if (score >= 80) {
    return 'migrate';
  } else if (score >= 50) {
    return 'hybrid';
  } else {
    return 'keep-sass';
  }
}

/**
 * Get migration difficulty for a specific feature type
 * @param {string} featureType - Type of feature (e.g., 'variables', 'mixins')
 * @param {number} count - Number of times feature is used
 * @returns {MigrationDifficulty}
 */
export function getFeatureDifficulty(featureType, count) {
  if (count === 0) {
    return 'easy';
  }

  // Feature difficulty mapping
  const difficultyMap = {
    variables: 'easy',
    nesting: 'easy',
    parentSelector: 'easy',
    operators: 'easy',
    imports: 'moderate',
    mixins: 'difficult',
    functions: 'difficult',
    controlFlow: 'impossible',
    builtInModules: 'impossible',
    interpolation: 'difficult',
    colorFunctions: 'moderate',
    extend: 'difficult',
    placeholders: 'difficult',
    maps: 'difficult',
    lists: 'moderate',
  };

  return difficultyMap[featureType] || 'moderate';
}

/**
 * Identify blocking features that prevent full migration
 * @param {DetectionResults} features
 * @returns {MigrationBlocker[]}
 */
export function identifyBlockers(features) {
  /** @type {MigrationBlocker[]} */
  const blockers = [];

  // Control flow - critical blocker
  if (features.controlFlow.count > 0) {
    blockers.push({
      featureType: 'Control Flow',
      reason: 'CSS has no equivalent for \@if, @for, @each, @while loops',
      count: features.controlFlow.count,
      severity: 'critical',
    });
  }

  // Function definitions - critical blocker
  if (features.functions.definitions > 0) {
    blockers.push({
      featureType: 'Custom Functions',
      reason: 'CSS has no equivalent for custom @function definitions',
      count: features.functions.definitions,
      severity: 'critical',
    });
  }

  // Mixin definitions with parameters - high blocker
  if (features.mixins.definitions > 0) {
    blockers.push({
      featureType: 'Mixins',
      reason: 'CSS has no equivalent for parametric @mixin definitions',
      count: features.mixins.definitions,
      severity: 'high',
    });
  }

  // Built-in modules - high blocker
  if (features.builtInModules.count > 0) {
    blockers.push({
      featureType: 'Built-in Modules',
      reason: `Uses Sass modules: ${features.builtInModules.modules.join(', ')}`,
      count: features.builtInModules.count,
      severity: 'high',
    });
  }

  // Interpolation - medium blocker (can sometimes be worked around)
  if (features.interpolation.count > 3) {
    // Only block if used heavily
    blockers.push({
      featureType: 'Interpolation',
      reason: 'Heavy use of #{} interpolation which CSS does not support',
      count: features.interpolation.count,
      severity: 'medium',
    });
  }

  return blockers;
}

/**
 * Estimate migration effort based on features
 * @param {DetectionResults} features
 * @param {MigrationScore} score
 * @returns {string} Effort estimate (e.g., "1-2 hours", "2-3 days")
 */
export function estimateMigrationEffort(features, score) {
  // Calculate total feature usage
  const totalFeatures =
    features.variables.count +
    features.nesting.count +
    features.mixins.count +
    features.functions.count +
    features.controlFlow.count +
    features.operators.count +
    features.colorFunctions.count +
    features.interpolation.count;

  // Check for blockers first
  const hasBlockers =
    features.controlFlow.count > 0 ||
    features.mixins.definitions > 0 ||
    features.functions.definitions > 0 ||
    features.builtInModules.count > 0;

  // Heavy blocker usage
  if (features.controlFlow.count > 3 || features.mixins.definitions > 5) {
    return '1-2 weeks (or keep Sass)';
  }

  // Base estimate on score
  if (score.overall >= 80) {
    if (totalFeatures < 20) {
      return '1-2 hours';
    } else if (totalFeatures < 50) {
      return '2-4 hours';
    } else {
      return '4-8 hours';
    }
  } else if (score.overall >= 50) {
    if (hasBlockers) {
      return '2-3 days';
    } else if (totalFeatures < 30) {
      return '1 day';
    } else {
      return '1-2 days';
    }
  } else {
    // Difficult or keep-sass
    if (hasBlockers) {
      return '1 week (or keep Sass)';
    } else if (totalFeatures < 50) {
      return '3-5 days';
    } else {
      return '1 week';
    }
  }
}

/**
 * Generate migration recommendation title
 * @param {RecommendationType} type
 * @returns {string}
 */
export function getRecommendationTitle(type) {
  const titles = {
    migrate: 'Migrate to Native CSS',
    hybrid: 'Hybrid Approach Recommended',
    'keep-sass': 'Keep Using Sass',
  };

  return titles[type] || 'Analysis Complete';
}

/**
 * Generate migration recommendation summary
 * @param {RecommendationType} type
 * @param {MigrationScore} score
 * @returns {string}
 */
export function getRecommendationSummary(type, score) {
  if (type === 'migrate') {
    return `Your codebase is a great candidate for migration to native CSS. Most features have CSS equivalents and the migration should be straightforward. (Score: ${score.overall}/100)`;
  } else if (type === 'hybrid') {
    return `A hybrid approach is recommended. Migrate simple features like variables and nesting to CSS, but keep Sass for complex features. (Score: ${score.overall}/100)`;
  } else {
    return `Your codebase relies heavily on Sass-specific features. Consider keeping Sass or carefully evaluate if migration benefits outweigh the effort. (Score: ${score.overall}/100)`;
  }
}
