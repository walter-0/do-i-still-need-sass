/**
 * @file Tests for Sass feature detector module
 */

import { describe, it, expect } from 'vitest';
import {
  detectFeatures,
  getFeatureSummary,
  hasBlockingFeatures,
} from '../../src/migration/detector.js';
import { parseSassSimple } from '../../src/migration/parser.js';

describe('detectFeatures', () => {
  describe('variable detection', () => {
    it('should detect variable declarations', () => {
      const code = '$primary-color: #3498db;';
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.variables.count).toBe(1);
      expect(results.variables.locations).toHaveLength(1);
    });

    it('should detect multiple variables', () => {
      const code = `
        $primary: #3498db;
        $secondary: #2ecc71;
        $font-size: 16px;
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.variables.count).toBe(3);
    });
  });

  describe('nesting detection', () => {
    it('should detect nested rules', () => {
      const code = `
        .parent {
          color: red;
          .child {
            color: blue;
          }
        }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.nesting.count).toBeGreaterThan(0);
    });

    it('should calculate max nesting depth', () => {
      const code = `
        .level1 {
          .level2 {
            .level3 {
              color: red;
            }
          }
        }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.nesting.maxDepth).toBe(3);
    });

    it('should not count top-level rules as nesting', () => {
      const code = '.button { color: red; }';
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.nesting.count).toBe(0);
    });
  });

  describe('mixin detection', () => {
    it('should detect mixin definitions', () => {
      const code = `
        @mixin button-style {
          padding: 10px;
          border-radius: 4px;
        }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.mixins.definitions).toBe(1);
      expect(results.mixins.count).toBe(1);
    });

    it('should detect mixin usages', () => {
      const code = `
        .button {
          @include button-style;
        }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.mixins.usages).toBe(1);
      expect(results.mixins.count).toBe(1);
    });

    it('should count both definitions and usages', () => {
      const code = `
        @mixin flex-center {
          display: flex;
          justify-content: center;
        }

        .container {
          @include flex-center;
        }

        .wrapper {
          @include flex-center;
        }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.mixins.definitions).toBe(1);
      expect(results.mixins.usages).toBe(2);
      expect(results.mixins.count).toBe(3);
    });
  });

  describe('function detection', () => {
    it('should detect function definitions', () => {
      const code = `
        @function calculate-rem($px) {
          @return $px / 16px * 1rem;
        }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.functions.definitions).toBe(1);
    });

    it('should detect custom function usages', () => {
      const code = `
        .heading {
          font-size: calculate-rem(24px);
        }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.functions.usages).toBeGreaterThan(0);
    });

    it('should not count CSS functions as custom functions', () => {
      const code = `
        .box {
          background: rgb(255, 0, 0);
          width: calc(100% - 20px);
          color: var(--primary);
        }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.functions.count).toBe(0);
    });
  });

  describe('control flow detection', () => {
    it('should detect @if statements', () => {
      const code = `
        @if $theme == 'dark' {
          background: black;
        }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.controlFlow.ifCount).toBe(1);
    });

    it('should detect @for loops', () => {
      const code = `
        @for $i from 1 through 3 {
          .col-#{$i} { width: percentage($i / 12); }
        }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.controlFlow.forCount).toBe(1);
    });

    it('should detect @each loops', () => {
      const code = `
        @each $color in red, blue, green {
          .bg-#{$color} { background: $color; }
        }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.controlFlow.eachCount).toBe(1);
    });

    it('should detect @while loops', () => {
      const code = `
        @while $i < 10 {
          .item-#{$i} { width: $i * 10px; }
        }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.controlFlow.whileCount).toBe(1);
    });

    it('should count total control flow statements', () => {
      const code = `
        @if $condition { color: red; }
        @for $i from 1 through 3 { }
        @each $item in $list { }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.controlFlow.count).toBe(3);
    });
  });

  describe('operator detection', () => {
    it('should detect math operators', () => {
      const code = `
        .box {
          width: $base-width * 2;
          height: 100px + 20px;
        }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.operators.count).toBeGreaterThan(0);
    });

    it('should not count calc() as Sass operators', () => {
      const code = `
        .box {
          width: calc(100% - 20px);
        }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.operators.count).toBe(0);
    });
  });

  describe('import detection', () => {
    it('should detect @import', () => {
      const code = `@import "variables";`;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.imports.count).toBe(1);
    });

    it('should detect @use', () => {
      const code = `@use "sass:math";`;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.imports.count).toBe(1);
    });

    it('should detect @forward', () => {
      const code = `@forward "mixins";`;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.imports.count).toBe(1);
    });
  });

  describe('extend detection', () => {
    it('should detect @extend', () => {
      const code = `
        .button {
          @extend %button-base;
        }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.extend.count).toBe(1);
    });
  });

  describe('parent selector detection', () => {
    it('should detect basic parent selector usage', () => {
      const code = `
        .button {
          &:hover {
            opacity: 0.8;
          }
        }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.parentSelector.count).toBe(1);
    });

    it('should detect advanced parent selector usage', () => {
      const code = `
        .block {
          &__element {
            color: red;
          }
          &--modifier {
            color: blue;
          }
        }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.parentSelector.count).toBe(2);
      expect(results.parentSelector.advancedUsage).toBe(2);
    });
  });

  describe('interpolation detection', () => {
    it('should detect interpolation in selectors', () => {
      const code = `
        .icon-#{$name} {
          background: url('icon-#{$name}.png');
        }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.interpolation.count).toBeGreaterThan(0);
    });

    it('should detect interpolation in property names', () => {
      const code = `
        .box {
          border-#{$side}: 1px solid;
        }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.interpolation.count).toBeGreaterThan(0);
    });
  });

  describe('color function detection', () => {
    it('should detect darken()', () => {
      const code = `
        .button {
          background: darken($primary, 10%);
        }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.colorFunctions.count).toBe(1);
    });

    it('should detect lighten()', () => {
      const code = `
        .button {
          background: lighten($primary, 10%);
        }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.colorFunctions.count).toBe(1);
    });

    it('should detect mix()', () => {
      const code = `
        .button {
          background: mix($color1, $color2, 50%);
        }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.colorFunctions.count).toBe(1);
    });
  });

  describe('built-in module detection', () => {
    it('should detect sass:math module', () => {
      const code = `@use "sass:math";`;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.builtInModules.count).toBe(1);
      expect(results.builtInModules.modules).toContain('sass:math');
    });

    it('should detect sass:color module', () => {
      const code = `@use "sass:color";`;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.builtInModules.modules).toContain('sass:color');
    });

    it('should track unique modules', () => {
      const code = `
        @use "sass:math";
        @use "sass:color";
        @use "sass:string";
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.builtInModules.modules).toHaveLength(3);
    });
  });

  describe('map detection', () => {
    it('should detect Sass maps', () => {
      const code = `
        $colors: (
          primary: #3498db,
          secondary: #2ecc71
        );
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.maps.count).toBe(1);
    });
  });

  describe('list detection', () => {
    it('should detect Sass lists', () => {
      const code = `
        $sizes: 10px, 20px, 30px;
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.lists.count).toBe(1);
    });
  });

  describe('placeholder detection', () => {
    it('should detect placeholder selectors', () => {
      const code = `
        %button-base {
          padding: 10px;
          border-radius: 4px;
        }
      `;
      const ast = parseSassSimple(code);
      const results = detectFeatures(ast);

      expect(results.placeholders.count).toBe(1);
    });
  });
});

describe('getFeatureSummary', () => {
  it('should calculate total features', () => {
    const code = `
      $color: red;
      .parent {
        .child {
          color: $color;
        }
      }
    `;
    const ast = parseSassSimple(code);
    const results = detectFeatures(ast);
    const summary = getFeatureSummary(results);

    expect(summary.totalFeatures).toBeGreaterThan(0);
  });

  it('should indicate if variables are present', () => {
    const code = '$color: red;';
    const ast = parseSassSimple(code);
    const results = detectFeatures(ast);
    const summary = getFeatureSummary(results);

    expect(summary.hasVariables).toBe(true);
  });

  it('should indicate if nesting is present', () => {
    const code = `
      .parent {
        .child {
          color: red;
        }
      }
    `;
    const ast = parseSassSimple(code);
    const results = detectFeatures(ast);
    const summary = getFeatureSummary(results);

    expect(summary.hasNesting).toBe(true);
  });

  it('should report max nesting depth', () => {
    const code = `
      .l1 {
        .l2 {
          .l3 {
            color: red;
          }
        }
      }
    `;
    const ast = parseSassSimple(code);
    const results = detectFeatures(ast);
    const summary = getFeatureSummary(results);

    expect(summary.maxNestingDepth).toBe(3);
  });

  it('should count unique modules', () => {
    const code = `
      @use "sass:math";
      @use "sass:color";
    `;
    const ast = parseSassSimple(code);
    const results = detectFeatures(ast);
    const summary = getFeatureSummary(results);

    expect(summary.uniqueModules).toBe(2);
  });
});

describe('hasBlockingFeatures', () => {
  it('should return true for control flow', () => {
    const code = `
      @for $i from 1 through 3 {
        .col-#{$i} { width: percentage($i / 12); }
      }
    `;
    const ast = parseSassSimple(code);
    const results = detectFeatures(ast);

    expect(hasBlockingFeatures(results)).toBe(true);
  });

  it('should return true for mixin definitions', () => {
    const code = `
      @mixin button-style {
        padding: 10px;
      }
    `;
    const ast = parseSassSimple(code);
    const results = detectFeatures(ast);

    expect(hasBlockingFeatures(results)).toBe(true);
  });

  it('should return true for function definitions', () => {
    const code = `
      @function double($n) {
        @return $n * 2;
      }
    `;
    const ast = parseSassSimple(code);
    const results = detectFeatures(ast);

    expect(hasBlockingFeatures(results)).toBe(true);
  });

  it('should return true for built-in modules', () => {
    const code = `@use "sass:math";`;
    const ast = parseSassSimple(code);
    const results = detectFeatures(ast);

    expect(hasBlockingFeatures(results)).toBe(true);
  });

  it('should return false for simple Sass', () => {
    const code = `
      $color: red;
      .button {
        color: $color;
        &:hover {
          opacity: 0.8;
        }
      }
    `;
    const ast = parseSassSimple(code);
    const results = detectFeatures(ast);

    expect(hasBlockingFeatures(results)).toBe(false);
  });
});

describe('comprehensive detection', () => {
  it('should handle complex real-world Sass', () => {
    const code = `
      @use "sass:math";

      $primary: #3498db;
      $secondary: #2ecc71;

      @mixin button-variant($bg) {
        background: $bg;
        &:hover {
          background: darken($bg, 10%);
        }
      }

      @function calculate-spacing($multiplier) {
        @return $multiplier * 8px;
      }

      .button {
        @include button-variant($primary);
        padding: calculate-spacing(2);

        @for $i from 1 through 3 {
          &.size-#{$i} {
            font-size: math.div(16px * $i, 2);
          }
        }
      }
    `;
    const ast = parseSassSimple(code);
    const results = detectFeatures(ast);

    expect(results.variables.count).toBeGreaterThan(0);
    expect(results.mixins.definitions).toBeGreaterThan(0);
    expect(results.functions.definitions).toBeGreaterThan(0);
    expect(results.controlFlow.count).toBeGreaterThan(0);
    expect(results.builtInModules.count).toBeGreaterThan(0);
  });
});
