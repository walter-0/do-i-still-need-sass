/**
 * @file Sass feature detector module
 * Analyzes PostCSS AST to identify and count Sass-specific features
 * @module migration/detector
 */

/**
 * @import {DetectionResults, SourceLocation} from '@/types'
 * @import {Node, AtRule, Rule, Declaration, Root} from 'postcss'
 */

/**
 * Detect all Sass features in the provided AST
 * @param {Root} ast - PostCSS AST (parsed with postcss-scss syntax)
 * @returns {DetectionResults} Detected features with counts and locations
 * @example
 * const ast = parseSass('$color: red; .button { color: $color; }');
 * const results = detectFeatures(ast);
 * console.log(results.variables.count); // 1
 */
export function detectFeatures(ast) {
  const results = initializeResults();

  // Walk the entire AST and detect features
  ast.walk((node) => {
    detectVariables(node, results);
    detectNesting(node, results);
    detectMixins(node, results);
    detectFunctions(node, results);
    detectControlFlow(node, results);
    detectOperators(node, results);
    detectImports(node, results);
    detectExtend(node, results);
    detectParentSelector(node, results);
    detectInterpolation(node, results);
    detectColorFunctions(node, results);
    detectBuiltInModules(node, results);
    detectMapsAndLists(node, results);
    detectPlaceholders(node, results);
  });

  return results;
}

/**
 * Initialize empty detection results structure
 * @returns {DetectionResults}
 */
function initializeResults() {
  return {
    variables: { count: 0, locations: [] },
    nesting: { count: 0, locations: [], maxDepth: 0 },
    mixins: { count: 0, locations: [], definitions: 0, usages: 0 },
    functions: { count: 0, locations: [], definitions: 0, usages: 0 },
    controlFlow: {
      count: 0,
      locations: [],
      ifCount: 0,
      forCount: 0,
      eachCount: 0,
      whileCount: 0,
    },
    operators: { count: 0, locations: [] },
    imports: { count: 0, locations: [] },
    extend: { count: 0, locations: [] },
    parentSelector: { count: 0, locations: [], advancedUsage: 0 },
    interpolation: { count: 0, locations: [] },
    colorFunctions: { count: 0, locations: [] },
    builtInModules: { count: 0, locations: [], modules: [] },
    maps: { count: 0, locations: [] },
    lists: { count: 0, locations: [] },
    placeholders: { count: 0, locations: [] },
  };
}

/**
 * Detect Sass variables ($var-name)
 * @param {Node} node
 * @param {DetectionResults} results
 */
function detectVariables(node, results) {
  if (node.type === 'decl') {
    const decl = /** @type {Declaration} */ (node);
    // Variable declarations: $variable-name: value;
    if (decl.prop && decl.prop.startsWith('$')) {
      results.variables.count++;
      results.variables.locations.push(getLocation(node));
    }
  }

  // Also detect variable usage in values
  if (node.type === 'decl') {
    const decl = /** @type {Declaration} */ (node);
    if (decl.value && decl.value.includes('$')) {
      // Could be variable usage in value - we already count declarations above
      // This helps us know variables are being used
    }
  }
}

/**
 * Detect CSS nesting and calculate depth
 * @param {Node} node
 * @param {DetectionResults} results
 */
function detectNesting(node, results) {
  if (node.type === 'rule') {
    const rule = /** @type {Rule} */ (node);
    const depth = calculateNestingDepth(rule);

    if (depth > 1) {
      results.nesting.count++;
      results.nesting.locations.push(getLocation(node));

      if (depth > results.nesting.maxDepth) {
        results.nesting.maxDepth = depth;
      }
    }
  }
}

/**
 * Calculate nesting depth for a rule
 * @param {Rule} rule
 * @returns {number}
 */
function calculateNestingDepth(rule) {
  let depth = 1;
  let current = rule.parent;

  while (current && current.type !== 'root') {
    if (current.type === 'rule') {
      depth++;
    }
    current = current.parent;
  }

  return depth;
}

/**
 * Detect mixin definitions and usages
 * @param {Node} node
 * @param {DetectionResults} results
 */
function detectMixins(node, results) {
  if (node.type === 'atrule') {
    const atRule = /** @type {AtRule} */ (node);

    // Mixin definitions: \@mixin name { ... }
    if (atRule.name === 'mixin') {
      results.mixins.count++;
      results.mixins.definitions++;
      results.mixins.locations.push(getLocation(node));
    }

    // Mixin usages: \@include name;
    if (atRule.name === 'include') {
      results.mixins.count++;
      results.mixins.usages++;
      results.mixins.locations.push(getLocation(node));
    }
  }
}

/**
 * Detect custom function definitions and usages
 * @param {Node} node
 * @param {DetectionResults} results
 */
function detectFunctions(node, results) {
  if (node.type === 'atrule') {
    const atRule = /** @type {AtRule} */ (node);

    // Function definitions: \@function name() { ... }
    if (atRule.name === 'function') {
      results.functions.count++;
      results.functions.definitions++;
      results.functions.locations.push(getLocation(node));
    }
  }

  // Function usages are harder to detect precisely without evaluation
  // We'll count known Sass function patterns in values
  if (node.type === 'decl') {
    const decl = /** @type {Declaration} */ (node);
    // Look for custom function calls (not CSS functions)
    // This is a heuristic - matches word-char-hyphen patterns
    // Simplified regex to avoid backtracking
    // eslint-disable-next-line sonarjs/slow-regex -- Safe: short strings only, limited by CSS value length
    const customFuncPattern = /[a-z][\w-]+\(/gi;
    const matches = decl.value?.match(customFuncPattern);

    if (matches) {
      // Filter out known CSS functions
      const cssFunctions = ['rgb(', 'rgba(', 'hsl(', 'hsla(', 'url(', 'var(', 'calc(', 'min(', 'max(', 'clamp('];
      const customMatches = matches.filter(
        (m) => !cssFunctions.some((cf) => m.toLowerCase().startsWith(cf.toLowerCase()))
      );

      if (customMatches.length > 0) {
        results.functions.usages += customMatches.length;
        // Only increment count once per declaration
        if (!results.functions.locations.some((loc) => loc.line === node.source?.start?.line)) {
          results.functions.count++;
          results.functions.locations.push(getLocation(node));
        }
      }
    }
  }
}

/**
 * Detect control flow directives (\@if, \@for, \@each, \@while)
 * @param {Node} node
 * @param {DetectionResults} results
 */
function detectControlFlow(node, results) {
  if (node.type === 'atrule') {
    const atRule = /** @type {AtRule} */ (node);

    if (atRule.name === 'if' || atRule.name === 'else') {
      results.controlFlow.count++;
      results.controlFlow.ifCount++;
      results.controlFlow.locations.push(getLocation(node));
    }

    if (atRule.name === 'for') {
      results.controlFlow.count++;
      results.controlFlow.forCount++;
      results.controlFlow.locations.push(getLocation(node));
    }

    if (atRule.name === 'each') {
      results.controlFlow.count++;
      results.controlFlow.eachCount++;
      results.controlFlow.locations.push(getLocation(node));
    }

    if (atRule.name === 'while') {
      results.controlFlow.count++;
      results.controlFlow.whileCount++;
      results.controlFlow.locations.push(getLocation(node));
    }
  }
}

/**
 * Detect Sass operators in expressions
 * @param {Node} node
 * @param {DetectionResults} results
 */
function detectOperators(node, results) {
  if (node.type === 'decl') {
    const decl = /** @type {Declaration} */ (node);

    // Sass math operators: +, -, *, /, %
    // Note: CSS calc() uses these too, so we try to exclude calc()
    if (decl.value && !decl.value.includes('calc(')) {
      // Simplified regex to avoid complexity and backtracking issues
      // eslint-disable-next-line sonarjs/slow-regex -- Safe: short strings only, limited by CSS value length
      const operatorPattern = /(\$[\w-]+|\d+px)\s*[+\-*/%]\s*(\$[\w-]+|\d+)/;
      if (operatorPattern.test(decl.value)) {
        results.operators.count++;
        results.operators.locations.push(getLocation(node));
      }
    }
  }
}

/**
 * Detect \@import, \@use, \@forward directives
 * @param {Node} node
 * @param {DetectionResults} results
 */
function detectImports(node, results) {
  if (node.type === 'atrule') {
    const atRule = /** @type {AtRule} */ (node);

    if (atRule.name === 'import' || atRule.name === 'use' || atRule.name === 'forward') {
      results.imports.count++;
      results.imports.locations.push(getLocation(node));
    }
  }
}

/**
 * Detect \@extend directive
 * @param {Node} node
 * @param {DetectionResults} results
 */
function detectExtend(node, results) {
  if (node.type === 'atrule') {
    const atRule = /** @type {AtRule} */ (node);

    if (atRule.name === 'extend') {
      results.extend.count++;
      results.extend.locations.push(getLocation(node));
    }
  }
}

/**
 * Detect parent selector (&) usage
 * @param {Node} node
 * @param {DetectionResults} results
 */
function detectParentSelector(node, results) {
  if (node.type === 'rule') {
    const rule = /** @type {Rule} */ (node);

    if (rule.selector && rule.selector.includes('&')) {
      results.parentSelector.count++;
      results.parentSelector.locations.push(getLocation(node));

      // Detect advanced usage: &-suffix, &__element, etc.
      if (/&[\w-]/.test(rule.selector)) {
        results.parentSelector.advancedUsage++;
      }
    }
  }
}

/**
 * Detect interpolation #{...}
 * @param {Node} node
 * @param {DetectionResults} results
 */
function detectInterpolation(node, results) {
  const nodeString = node.toString();

  if (nodeString && nodeString.includes('#{')) {
    results.interpolation.count++;
    results.interpolation.locations.push(getLocation(node));
  }
}

/**
 * Detect Sass color functions (darken, lighten, mix, etc.)
 * @param {Node} node
 * @param {DetectionResults} results
 */
function detectColorFunctions(node, results) {
  if (node.type === 'decl') {
    const decl = /** @type {Declaration} */ (node);

    const colorFunctions = [
      'darken',
      'lighten',
      'saturate',
      'desaturate',
      'adjust-hue',
      'mix',
      'transparentize',
      'opacify',
      'fade-in',
      'fade-out',
    ];

    if (decl.value) {
      for (const func of colorFunctions) {
        if (decl.value.includes(`${func}(`)) {
          results.colorFunctions.count++;
          results.colorFunctions.locations.push(getLocation(node));
          break; // Only count once per declaration
        }
      }
    }
  }
}

/**
 * Detect built-in Sass modules (sass:math, sass:color, etc.)
 * @param {Node} node
 * @param {DetectionResults} results
 */
function detectBuiltInModules(node, results) {
  if (node.type === 'atrule') {
    const atRule = /** @type {AtRule} */ (node);

    if (atRule.name === 'use' && atRule.params) {
      // Check for sass:* modules
      const moduleMatch = atRule.params.match(/['"]sass:([\w-]+)['"]/);
      if (moduleMatch) {
        results.builtInModules.count++;
        results.builtInModules.locations.push(getLocation(node));

        const moduleName = `sass:${moduleMatch[1]}`;
        if (!results.builtInModules.modules.includes(moduleName)) {
          results.builtInModules.modules.push(moduleName);
        }
      }
    }
  }
}

/**
 * Detect Sass maps and lists
 * @param {Node} node
 * @param {DetectionResults} results
 */
function detectMapsAndLists(node, results) {
  if (node.type === 'decl') {
    const decl = /** @type {Declaration} */ (node);

    // Maps: $map: (key: value, key2: value2)
    if (decl.value && /\([^)]*:\s*[^)]+\)/.test(decl.value)) {
      results.maps.count++;
      results.maps.locations.push(getLocation(node));
    }

    // Lists: $list: item1, item2, item3
    // This is tricky - CSS also uses commas, so we check for Sass variable assignment
    if (decl.prop?.startsWith('$') && decl.value?.includes(',')) {
      // Might be a list, but could also be a map (detected above)
      // Only count if not already counted as a map
      const alreadyCountedAsMap = results.maps.locations.some((loc) => loc.line === node.source?.start?.line);
      if (!alreadyCountedAsMap) {
        results.lists.count++;
        results.lists.locations.push(getLocation(node));
      }
    }
  }
}

/**
 * Detect placeholder selectors (%placeholder)
 * @param {Node} node
 * @param {DetectionResults} results
 */
function detectPlaceholders(node, results) {
  if (node.type === 'rule') {
    const rule = /** @type {Rule} */ (node);

    if (rule.selector?.includes('%')) {
      results.placeholders.count++;
      results.placeholders.locations.push(getLocation(node));
    }
  }
}

/**
 * Extract source location from a PostCSS node
 * @param {Node} node
 * @returns {SourceLocation}
 */
function getLocation(node) {
  const source = node.source;
  return {
    line: source?.start?.line || 0,
    column: source?.start?.column || 0,
    offset: source?.start?.offset || 0,
  };
}

/**
 * Get summary statistics from detection results
 * @param {DetectionResults} results
 * @returns {object} Summary stats
 */
export function getFeatureSummary(results) {
  return {
    totalFeatures: Object.values(results).reduce((sum, feature) => {
      return sum + (typeof feature === 'object' && 'count' in feature ? feature.count : 0);
    }, 0),
    hasVariables: results.variables.count > 0,
    hasNesting: results.nesting.count > 0,
    hasMixins: results.mixins.count > 0,
    hasFunctions: results.functions.count > 0,
    hasControlFlow: results.controlFlow.count > 0,
    hasBuiltInModules: results.builtInModules.count > 0,
    maxNestingDepth: results.nesting.maxDepth,
    uniqueModules: results.builtInModules.modules.length,
  };
}

/**
 * Check if code uses any "blocking" features that prevent migration
 * @param {DetectionResults} results
 * @returns {boolean}
 */
export function hasBlockingFeatures(results) {
  return (
    results.controlFlow.count > 0 ||
    results.mixins.definitions > 0 ||
    results.functions.definitions > 0 ||
    results.builtInModules.count > 0
  );
}
