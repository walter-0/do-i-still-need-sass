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
 * - 80-100: Easy - Most features have CSS equivalents
 * - 50-79: Moderate - Hybrid approach recommended
 * - 20-49: Difficult - Keep most Sass
 * - 0-19: Keep Sass - Too many blockers
 * @param {DetectionResults} features - Detected Sass features
 * @param {object} [options] - Scoring options
 * @param {object} [options.weights] - Custom weights for different categories
 * @returns {MigrationScore} Score breakdown
 */
export function calculateMigrationScore(features, options = {}) {
  const weights = {
    variables: options.weights?.variables ?? 1.0,
    nesting: options.weights?.nesting ?? 1.0,
    complexity: options.weights?.complexity ?? 1.0,
    blockers: options.weights?.blockers ?? 1.0,
  };

  // Score each category (0-100)
  const variablesScore = scoreVariables(features) * weights.variables;
  const nestingScore = scoreNesting(features) * weights.nesting;
  const complexityScore = scoreComplexity(features) * weights.complexity;
  const blockersScore = scoreBlockers(features) * weights.blockers;

  // Calculate weighted average
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const overall = Math.round((variablesScore + nestingScore + complexityScore + blockersScore) / totalWeight);

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
 * @param {DetectionResults} features
 * @returns {number}
 */
function scoreNesting(features) {
  const count = features.nesting.count;
  const maxDepth = features.nesting.maxDepth;

  if (count === 0) {
    return 100; // No nesting = perfect score
  }

  // Penalize based on depth
  let score;

  // Depth penalties (more aggressive)
  if (maxDepth <= 2) {
    score = 90; // Shallow nesting - very easy
  } else if (maxDepth <= 3) {
    score = 70; // Moderate depth
  } else if (maxDepth <= 4) {
    score = 50; // Deep nesting
  } else {
    score = 30; // Very deep nesting - problematic
  }

  // Also penalize for volume (lots of nested rules)
  const volumeDeduction = Math.min(30, Math.floor(count / 5) * 5);
  score -= volumeDeduction;

  return Math.max(0, score);
}

/**
 * Score complexity features (parent selector, interpolation, etc.)
 * @param {DetectionResults} features
 * @returns {number}
 */
function scoreComplexity(features) {
  let score = 100;

  // Parent selector (&) - native CSS supports basic usage
  if (features.parentSelector.count > 0) {
    // Basic parent selector usage is fine
    score -= 5;
    // Advanced usage (BEM patterns like &__element) needs more work
    score -= features.parentSelector.advancedUsage * 3;
  }

  // Interpolation - no direct CSS equivalent
  if (features.interpolation.count > 0) {
    score -= features.interpolation.count * 10;
  }

  // Operators - calc() can replace most
  if (features.operators.count > 0) {
    score -= features.operators.count * 5;
  }

  // Color functions - some CSS equivalents exist
  if (features.colorFunctions.count > 0) {
    score -= features.colorFunctions.count * 8;
  }

  // \@extend - no CSS equivalent, but can be refactored
  if (features.extend.count > 0) {
    score -= features.extend.count * 10;
  }

  // Placeholders - tied to \@extend
  if (features.placeholders.count > 0) {
    score -= features.placeholders.count * 10;
  }

  // Maps and lists - limited CSS equivalents
  if (features.maps.count > 0) {
    score -= features.maps.count * 8;
  }
  if (features.lists.count > 0) {
    score -= features.lists.count * 5;
  }

  return Math.max(0, score);
}

/**
 * Score blockers (features with no CSS equivalent)
 * @param {DetectionResults} features
 * @returns {number}
 */
function scoreBlockers(features) {
  let score = 100;

  // Control flow - MAJOR blocker, no CSS equivalent
  if (features.controlFlow.count > 0) {
    score -= features.controlFlow.count * 30; // Increased from 20
    // Extra penalty for loops (very dynamic)
    score -= (features.controlFlow.forCount + features.controlFlow.eachCount) * 10; // Increased from 5
  }

  // Mixin definitions - significant blocker
  if (features.mixins.definitions > 0) {
    score -= features.mixins.definitions * 25; // Increased from 15
  }

  // Function definitions - significant blocker
  if (features.functions.definitions > 0) {
    score -= features.functions.definitions * 25; // Increased from 15
  }

  // Built-in modules - strong blocker
  if (features.builtInModules.count > 0) {
    score -= features.builtInModules.count * 20; // Increased from 12
  }

  // Mixin/function usages are less critical (can be inlined)
  if (features.mixins.usages > 0) {
    score -= features.mixins.usages * 8; // Increased from 5
  }
  if (features.functions.usages > 0) {
    score -= features.functions.usages * 8; // Increased from 5
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
