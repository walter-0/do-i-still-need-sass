/**
 * @file Sass code parser module using PostCSS with postcss-scss
 * Provides parsing functionality with comprehensive error handling
 * @module migration/parser
 */

import postcss from 'postcss';
import postcssScss from 'postcss-scss';

/**
 * @import {ParseResult, ParserError} from '@/types'
 * @import {Root} from 'postcss'
 */

/**
 * Parse Sass/SCSS code into an Abstract Syntax Tree (AST)
 * @param {string} code - The Sass/SCSS code to parse
 * @param {object} [options] - Parsing options
 * @param {string} [options.from] - Source file path (for error messages)
 * @param {boolean} [options.strict] - Throw on parse errors vs collect them
 * @returns {ParseResult} Parse result with AST or errors
 * @example
 * const result = parseSass('$primary: #3498db; .button { color: $primary; }');
 * if (result.success) {
 *   console.log('AST:', result.ast);
 * } else {
 *   console.error('Errors:', result.errors);
 * }
 */
export function parseSass(code, options = {}) {
  const { from = 'input.scss', strict = false } = options;

  /** @type {ParserError[]} */
  const errors = [];
  /** @type {ParserError[]} */
  const warnings = [];

  // Validate input
  if (typeof code !== 'string') {
    return {
      success: false,
      ast: null,
      errors: [
        {
          message: 'Input must be a string',
          severity: 'error',
        },
      ],
      warnings: [],
    };
  }

  if (code.trim().length === 0) {
    return {
      success: false,
      ast: null,
      errors: [
        {
          message: 'Input code is empty',
          severity: 'error',
        },
      ],
      warnings: [],
    };
  }

  try {
    // Parse with PostCSS using postcss-scss syntax
    const result = postcss().process(code, {
      syntax: postcssScss,
      from,
    });

    // Collect warnings
    result.warnings().forEach((warning) => {
      warnings.push({
        message: warning.text,
        location: warning.line
          ? {
              line: warning.line,
              column: warning.column || 0,
              offset: 0, // PostCSS doesn't provide offset
            }
          : undefined,
        severity: 'warning',
      });
    });

    // Return successful parse result
    return {
      success: true,
      ast: result.root,
      errors: [],
      warnings,
    };
  } catch (error) {
    // Handle parse errors
    const parseError = {
      message: error.message || 'Unknown parse error',
      location:
        error.line !== undefined
          ? {
              line: error.line,
              column: error.column || 0,
              offset: 0,
            }
          : undefined,
      severity: 'error',
    };

    errors.push(parseError);

    // In strict mode, throw the error
    if (strict) {
      throw error;
    }

    // Return error result
    return {
      success: false,
      ast: null,
      errors,
      warnings,
    };
  }
}

/**
 * Parse Sass code and return only the AST, or null on error
 * Convenience wrapper for parseSass that discards error details
 * @param {string} code - The Sass/SCSS code to parse
 * @param {object} [options] - Parsing options
 * @returns {Root | null} AST root node or null on error
 * @example
 * const ast = parseSassSimple('$color: red;');
 * if (ast) {
 *   // Work with AST
 * }
 */
export function parseSassSimple(code, options = {}) {
  const result = parseSass(code, options);
  return result.success ? result.ast : null;
}

/**
 * Validate Sass code syntax without returning the AST
 * @param {string} code - The Sass/SCSS code to validate
 * @returns {object} Validation result
 * @returns {boolean} result.valid - Whether the code is valid
 * @returns {ParserError[]} result.errors - Array of errors found
 * @returns {ParserError[]} result.warnings - Array of warnings found
 * @example
 * const { valid, errors } = validateSass('$color: red; .button { color: $color }');
 * if (!valid) {
 *   console.error('Syntax errors:', errors);
 * }
 */
export function validateSass(code) {
  const result = parseSass(code);
  return {
    valid: result.success,
    errors: result.errors,
    warnings: result.warnings,
  };
}

/**
 * Check if a string contains valid Sass/SCSS syntax
 * Simple boolean check, discards error details
 * @param {string} code - The Sass/SCSS code to check
 * @returns {boolean} True if code is valid Sass
 * @example
 * if (isSassValid('$color: red;')) {
 *   console.log('Valid Sass!');
 * }
 */
export function isSassValid(code) {
  const result = parseSass(code);
  return result.success;
}

/**
 * Get parser version information
 * @returns {object} Version information
 * @returns {string} return.postcss - PostCSS version
 * @returns {string} return.postcssScss - postcss-scss version
 * @example
 * const versions = getParserVersion();
 * console.log('Using PostCSS', versions.postcss);
 */
export function getParserVersion() {
  return {
    postcss: postcss().version,
    postcssScss: '4.0.9', // postcss-scss doesn't expose version easily
  };
}
