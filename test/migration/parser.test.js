/**
 * @file Tests for Sass parser module
 */

import { describe, it, expect } from 'vitest';
import {
  parseSass,
  parseSassSimple,
  validateSass,
  isSassValid,
  getParserVersion,
} from '../../src/migration/parser.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('parseSass', () => {
  describe('basic parsing', () => {
    it('should parse simple variables', () => {
      const code = '$primary: #3498db;';
      const result = parseSass(code);

      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should parse variables with nesting', () => {
      const code = `
        $color: red;
        .button {
          background: $color;
          &:hover {
            opacity: 0.8;
          }
        }
      `;
      const result = parseSass(code);

      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
    });

    it('should parse mixins', () => {
      const code = `
        @mixin button-style {
          padding: 10px;
          border-radius: 4px;
        }

        .button {
          @include button-style;
        }
      `;
      const result = parseSass(code);

      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
    });

    it('should parse control flow', () => {
      const code = `
        @for $i from 1 through 3 {
          .col-#{$i} {
            width: percentage($i / 12);
          }
        }
      `;
      const result = parseSass(code);

      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
    });

    it('should parse @use and @forward', () => {
      const code = `
        @use "sass:math";
        @use "sass:color";

        $width: math.div(100px, 2);
      `;
      const result = parseSass(code);

      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
    });

    it('should parse custom functions', () => {
      const code = `
        @function calculate-rem($px) {
          @return $px / 16px * 1rem;
        }

        .heading {
          font-size: calculate-rem(24px);
        }
      `;
      const result = parseSass(code);

      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
    });
  });

  describe('error handling', () => {
    const UNCLOSED_BRACE = '.button { color: red';

    it('should collect parse errors', () => {
      const result = parseSass(UNCLOSED_BRACE);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should include location in errors when available', () => {
      const result = parseSass(UNCLOSED_BRACE);

      if (result.errors.length > 0 && result.errors[0].location) {
        expect(result.errors[0].location.line).toBeGreaterThan(0);
      }
    });

    it('should support strict mode', () => {
      expect(() => {
        parseSass(UNCLOSED_BRACE, { strict: true });
      }).toThrow();
    });
  });

  describe('options', () => {
    it('should accept "from" option for source file path', () => {
      const code = '$color: red;';
      const result = parseSass(code, { from: 'test.scss' });

      expect(result.success).toBe(true);
    });

    it('should use default "from" value', () => {
      const code = '$color: red;';
      const result = parseSass(code);

      expect(result.success).toBe(true);
    });
  });

  describe('warnings', () => {
    it('should collect warnings without failing', () => {
      // PostCSS warnings are rare in valid Sass, but the structure should support them
      const code = '$color: red; .button { color: $color; }';
      const result = parseSass(code);

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });
});

describe('parseSassSimple', () => {
  const UNCLOSED_BRACE = '.button { color: red';

  it('should return AST on success', () => {
    const code = '$primary: blue;';
    const ast = parseSassSimple(code);

    expect(ast).toBeDefined();
    expect(ast).not.toBeNull();
    expect(ast.type).toBe('root');
  });

  it('should return null on error', () => {
    const ast = parseSassSimple(UNCLOSED_BRACE);

    expect(ast).toBeNull();
  });
});

describe('validateSass', () => {
  const UNCLOSED_BRACE = '.button { color: red';

  it('should return valid: true for correct Sass', () => {
    const code = '$color: red; .button { color: $color; }';
    const result = validateSass(code);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should return valid: false for incorrect Sass', () => {
    const result = validateSass(UNCLOSED_BRACE);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should include errors array', () => {
    const code = '$color: red;';
    const result = validateSass(code);

    expect(result.errors).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it('should include warnings array', () => {
    const code = '$color: red;';
    const result = validateSass(code);

    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});

describe('isSassValid', () => {
  const UNCLOSED_BRACE = '.button { color: red';

  it('should return true for valid Sass', () => {
    const code = '$color: red;';
    expect(isSassValid(code)).toBe(true);
  });

  it('should return false for invalid Sass', () => {
    expect(isSassValid(UNCLOSED_BRACE)).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isSassValid('')).toBe(false);
  });

  it('should return false for non-string input', () => {
    expect(isSassValid(123)).toBe(false);
  });
});

describe('getParserVersion', () => {
  it('should return version information', () => {
    const versions = getParserVersion();

    expect(versions).toBeDefined();
    expect(versions.postcss).toBeDefined();
    expect(versions.postcssScss).toBeDefined();
  });

  it('should return semantic version format', () => {
    const versions = getParserVersion();

    // Should match x.y.z format
    expect(versions.postcss).toMatch(/^\d+\.\d+\.\d+/);
    expect(versions.postcssScss).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe('real-world test fixtures', () => {
  const fixturesDir = join(process.cwd(), 'test', 'fixtures', 'sass-samples');

  it('should parse 01-simple-variables.scss', () => {
    const code = readFileSync(join(fixturesDir, '01-simple-variables.scss'), 'utf-8');
    const result = parseSass(code);

    expect(result.success).toBe(true);
    expect(result.ast).toBeDefined();
  });

  it('should parse 02-variables-nesting.scss', () => {
    const code = readFileSync(join(fixturesDir, '02-variables-nesting.scss'), 'utf-8');
    const result = parseSass(code);

    expect(result.success).toBe(true);
  });

  it('should parse 05-mixin-with-params.scss', () => {
    const code = readFileSync(join(fixturesDir, '05-mixin-with-params.scss'), 'utf-8');
    const result = parseSass(code);

    expect(result.success).toBe(true);
  });

  it('should parse 06-control-flow-loops.scss', () => {
    const code = readFileSync(join(fixturesDir, '06-control-flow-loops.scss'), 'utf-8');
    const result = parseSass(code);

    expect(result.success).toBe(true);
  });

  it('should parse 09-custom-functions.scss', () => {
    const code = readFileSync(join(fixturesDir, '09-custom-functions.scss'), 'utf-8');
    const result = parseSass(code);

    expect(result.success).toBe(true);
  });

  it('should parse 15-complex-real-world.scss', () => {
    const code = readFileSync(join(fixturesDir, '15-complex-real-world.scss'), 'utf-8');
    const result = parseSass(code);

    expect(result.success).toBe(true);
  });

  it('should parse all 15 test fixtures', () => {
    const files = [
      '01-simple-variables.scss',
      '02-variables-nesting.scss',
      '03-deep-nesting.scss',
      '04-simple-mixin.scss',
      '05-mixin-with-params.scss',
      '06-control-flow-loops.scss',
      '07-control-flow-each.scss',
      '08-control-flow-if.scss',
      '09-custom-functions.scss',
      '10-built-in-modules.scss',
      '11-maps-lists.scss',
      '12-extend-placeholders.scss',
      '13-interpolation.scss',
      '14-advanced-parent-selector.scss',
      '15-complex-real-world.scss',
    ];

    for (const file of files) {
      const code = readFileSync(join(fixturesDir, file), 'utf-8');
      const result = parseSass(code);

      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
    }
  });
});

describe('AST structure', () => {
  it('should return PostCSS Root node', () => {
    const code = '$color: red;';
    const result = parseSass(code);

    expect(result.ast.type).toBe('root');
    expect(result.ast.nodes).toBeDefined();
    expect(Array.isArray(result.ast.nodes)).toBe(true);
  });

  it('should have traversable nodes', () => {
    const code = `
      $color: red;
      .button {
        background: $color;
      }
    `;
    const result = parseSass(code);

    expect(result.ast.nodes.length).toBeGreaterThan(0);

    // Should be able to walk the AST
    let nodeCount = 0;
    result.ast.walk(() => {
      nodeCount++;
    });

    expect(nodeCount).toBeGreaterThan(0);
  });

  it('should preserve source locations', () => {
    const code = '$color: red;\n.button {\n  color: $color;\n}';
    const result = parseSass(code, { from: 'test.scss' });

    const firstNode = result.ast.nodes[0];
    expect(firstNode.source).toBeDefined();
    expect(firstNode.source.start).toBeDefined();
  });
});
