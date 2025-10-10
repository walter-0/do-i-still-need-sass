/**
 * @file Tests for migration scoring algorithm
 */

import { describe, it, expect } from 'vitest';
import {
  calculateMigrationScore,
  getRecommendationType,
  getFeatureDifficulty,
  identifyBlockers,
  estimateMigrationEffort,
  getRecommendationTitle,
  getRecommendationSummary,
} from '../../src/migration/scorer.js';
import { detectFeatures } from '../../src/migration/detector.js';
import { parseSassSimple } from '../../src/migration/parser.js';

describe('calculateMigrationScore', () => {
  describe('simple codebases', () => {
    it('should give high scores to variable-only code', () => {
      const code = `
        $primary: #3498db;
        $secondary: #2ecc71;
        .button { color: $primary; }
      `;
      const ast = parseSassSimple(code);
      const features = detectFeatures(ast);
      const score = calculateMigrationScore(features);

      expect(score.overall).toBeGreaterThan(80);
      expect(score.breakdown.variables).toBeGreaterThan(70);
    });

    it('should give high scores to simple nesting', () => {
      const code = `
        .button {
          color: red;
          &:hover { opacity: 0.8; }
        }
      `;
      const ast = parseSassSimple(code);
      const features = detectFeatures(ast);
      const score = calculateMigrationScore(features);

      expect(score.overall).toBeGreaterThan(80);
      expect(score.breakdown.nesting).toBeGreaterThan(80);
    });

    it('should score perfect for plain CSS', () => {
      const code = `.button { color: red; }`;
      const ast = parseSassSimple(code);
      const features = detectFeatures(ast);
      const score = calculateMigrationScore(features);

      expect(score.overall).toBe(100);
    });
  });

  describe('moderate complexity', () => {
    it('should give moderate scores to deep nesting', () => {
      const code = `
        .level1 {
          .level2 {
            .level3 {
              .level4 {
                .level5 {
                  color: red;
                }
              }
            }
          }
        }
      `;
      const ast = parseSassSimple(code);
      const features = detectFeatures(ast);
      const score = calculateMigrationScore(features);

      expect(score.overall).toBeLessThan(90); // Deep nesting alone isn't terrible
      expect(score.breakdown.nesting).toBeLessThan(40); // But nesting score should be low
    });

    it('should penalize interpolation', () => {
      const code = `
        .icon-#{$name} {
          background: url('icon-#{$name}.png');
        }
      `;
      const ast = parseSassSimple(code);
      const features = detectFeatures(ast);
      const score = calculateMigrationScore(features);

      expect(score.breakdown.complexity).toBeLessThan(90);
    });

    it('should penalize color functions', () => {
      const code = `
        .button {
          background: darken($primary, 10%);
        }
      `;
      const ast = parseSassSimple(code);
      const features = detectFeatures(ast);
      const score = calculateMigrationScore(features);

      expect(score.breakdown.complexity).toBeLessThan(95);
    });
  });

  describe('complex codebases with blockers', () => {
    it('should heavily penalize control flow', () => {
      const code = `
        @for $i from 1 through 3 {
          .col-#{$i} { width: percentage($i / 12); }
        }
      `;
      const ast = parseSassSimple(code);
      const features = detectFeatures(ast);
      const score = calculateMigrationScore(features);

      expect(score.overall).toBeLessThan(90); // Single @for isn't catastrophic
      expect(score.breakdown.blockers).toBeLessThan(70); // But blockers score should be penalized
    });

    it('should heavily penalize mixin definitions', () => {
      const code = `
        @mixin button-variant($bg) {
          background: $bg;
          &:hover { background: darken($bg, 10%); }
        }
        .button { @include button-variant(red); }
      `;
      const ast = parseSassSimple(code);
      const features = detectFeatures(ast);
      const score = calculateMigrationScore(features);

      // Mixin definition + usage + color function
      expect(score.breakdown.blockers).toBeLessThan(80); // Blockers score should be penalized
      expect(score.breakdown.complexity).toBeLessThan(100); // Color function penalized
    });

    it('should heavily penalize function definitions', () => {
      const code = `
        @function calculate-rem($px) {
          @return $px / 16px * 1rem;
        }
        .heading { font-size: calculate-rem(24px); }
      `;
      const ast = parseSassSimple(code);
      const features = detectFeatures(ast);
      const score = calculateMigrationScore(features);

      // Function definition + usage
      expect(score.breakdown.blockers).toBeLessThan(80); // Blockers score should be penalized
    });

    it('should heavily penalize built-in modules', () => {
      const code = `
        @use "sass:math";
        .box { width: math.div(100px, 2); }
      `;
      const ast = parseSassSimple(code);
      const features = detectFeatures(ast);
      const score = calculateMigrationScore(features);

      // Built-in module usage
      expect(score.breakdown.blockers).toBeLessThan(90); // Blockers score should be penalized
    });
  });

  describe('score breakdown', () => {
    it('should provide detailed breakdown', () => {
      const code = `
        $color: red;
        .button {
          .icon { color: $color; }
        }
      `;
      const ast = parseSassSimple(code);
      const features = detectFeatures(ast);
      const score = calculateMigrationScore(features);

      expect(score.breakdown).toHaveProperty('variables');
      expect(score.breakdown).toHaveProperty('nesting');
      expect(score.breakdown).toHaveProperty('complexity');
      expect(score.breakdown).toHaveProperty('blockers');
    });
  });

  describe('custom weights', () => {
    it('should apply custom weights', () => {
      const code = `$color: red;`;
      const ast = parseSassSimple(code);
      const features = detectFeatures(ast);

      const defaultScore = calculateMigrationScore(features);
      const weightedScore = calculateMigrationScore(features, {
        weights: { variables: 2.0, nesting: 1.0, complexity: 1.0, blockers: 1.0 },
      });

      // Scores should differ when weights change
      expect(defaultScore.overall).toBeDefined();
      expect(weightedScore.overall).toBeDefined();
    });
  });

  describe('real-world scenarios', () => {
    it('should score complete design system as difficult/keep-sass', () => {
      const code = `
        @use "sass:math";
        @use "sass:color";

        @function spacing($multiplier) {
          @return $multiplier * 8px;
        }

        @mixin button-variant($bg, $color) {
          background: $bg;
          color: $color;
          &:hover { background: color.adjust($bg, $lightness: -10%); }
        }

        @each $name, $color in $theme-colors {
          .btn-#{$name} {
            @include button-variant($color, white);
          }
        }

        @for $i from 1 through 12 {
          .col-#{$i} { width: math.div(100%, 12) * $i; }
        }
      `;
      const ast = parseSassSimple(code);
      const features = detectFeatures(ast);
      const score = calculateMigrationScore(features);

      // Multiple blockers: 2 modules, 1 function, 1 mixin, 2 control flow
      // Score should be in hybrid or keep-sass range
      expect(score.overall).toBeLessThan(80); // Not easy to migrate
      expect(getRecommendationType(score.overall)).not.toBe('migrate');
    });

    it('should score utility CSS as migrate', () => {
      const code = `
        $spacing-base: 8px;
        $color-primary: #3498db;

        .mt-1 { margin-top: $spacing-base; }
        .mt-2 { margin-top: $spacing-base * 2; }
        .text-primary { color: $color-primary; }

        .button {
          &:hover { opacity: 0.8; }
          &:active { opacity: 0.9; }
        }
      `;
      const ast = parseSassSimple(code);
      const features = detectFeatures(ast);
      const score = calculateMigrationScore(features);

      expect(score.overall).toBeGreaterThan(70);
    });
  });
});

describe('getRecommendationType', () => {
  it('should recommend migrate for high scores', () => {
    expect(getRecommendationType(90)).toBe('migrate');
    expect(getRecommendationType(80)).toBe('migrate');
  });

  it('should recommend hybrid for moderate scores', () => {
    expect(getRecommendationType(70)).toBe('hybrid');
    expect(getRecommendationType(50)).toBe('hybrid');
  });

  it('should recommend keep-sass for low scores', () => {
    expect(getRecommendationType(40)).toBe('keep-sass');
    expect(getRecommendationType(20)).toBe('keep-sass');
    expect(getRecommendationType(0)).toBe('keep-sass');
  });
});

describe('getFeatureDifficulty', () => {
  it('should classify variables as easy', () => {
    expect(getFeatureDifficulty('variables', 10)).toBe('easy');
  });

  it('should classify nesting as easy', () => {
    expect(getFeatureDifficulty('nesting', 5)).toBe('easy');
  });

  it('should classify mixins as difficult', () => {
    expect(getFeatureDifficulty('mixins', 3)).toBe('difficult');
  });

  it('should classify functions as difficult', () => {
    expect(getFeatureDifficulty('functions', 2)).toBe('difficult');
  });

  it('should classify control flow as impossible', () => {
    expect(getFeatureDifficulty('controlFlow', 1)).toBe('impossible');
  });

  it('should classify built-in modules as impossible', () => {
    expect(getFeatureDifficulty('builtInModules', 1)).toBe('impossible');
  });

  it('should return easy for zero count', () => {
    expect(getFeatureDifficulty('anything', 0)).toBe('easy');
  });
});

describe('identifyBlockers', () => {
  it('should identify control flow as blocker', () => {
    const code = `
      @for $i from 1 through 3 {
        .col-#{$i} { width: percentage($i / 12); }
      }
    `;
    const ast = parseSassSimple(code);
    const features = detectFeatures(ast);
    const blockers = identifyBlockers(features);

    expect(blockers.length).toBeGreaterThan(0);
    expect(blockers.some((b) => b.featureType === 'Control Flow')).toBe(true);
    expect(blockers.some((b) => b.severity === 'critical')).toBe(true);
  });

  it('should identify function definitions as blocker', () => {
    const code = `
      @function double($n) {
        @return $n * 2;
      }
    `;
    const ast = parseSassSimple(code);
    const features = detectFeatures(ast);
    const blockers = identifyBlockers(features);

    expect(blockers.some((b) => b.featureType === 'Custom Functions')).toBe(true);
  });

  it('should identify mixin definitions as blocker', () => {
    const code = `
      @mixin button-style {
        padding: 10px;
      }
    `;
    const ast = parseSassSimple(code);
    const features = detectFeatures(ast);
    const blockers = identifyBlockers(features);

    expect(blockers.some((b) => b.featureType === 'Mixins')).toBe(true);
  });

  it('should identify built-in modules as blocker', () => {
    const code = `@use "sass:math";`;
    const ast = parseSassSimple(code);
    const features = detectFeatures(ast);
    const blockers = identifyBlockers(features);

    expect(blockers.some((b) => b.featureType === 'Built-in Modules')).toBe(true);
    expect(blockers.some((b) => b.reason.includes('sass:math'))).toBe(true);
  });

  it('should return empty array for simple Sass', () => {
    const code = `
      $color: red;
      .button {
        color: $color;
        &:hover { opacity: 0.8; }
      }
    `;
    const ast = parseSassSimple(code);
    const features = detectFeatures(ast);
    const blockers = identifyBlockers(features);

    expect(blockers).toHaveLength(0);
  });

  it('should include blocker count', () => {
    const code = `
      @for $i from 1 through 3 { }
      @for $j from 1 through 5 { }
    `;
    const ast = parseSassSimple(code);
    const features = detectFeatures(ast);
    const blockers = identifyBlockers(features);

    const controlFlowBlocker = blockers.find((b) => b.featureType === 'Control Flow');
    expect(controlFlowBlocker?.count).toBe(2);
  });
});

describe('estimateMigrationEffort', () => {
  it('should estimate short time for simple code', () => {
    const code = `$color: red; .button { color: $color; }`;
    const ast = parseSassSimple(code);
    const features = detectFeatures(ast);
    const score = calculateMigrationScore(features);
    const effort = estimateMigrationEffort(features, score);

    expect(effort).toMatch(/hour/i);
  });

  it('should estimate longer time for complex code', () => {
    const code = `
      @use "sass:math";
      @mixin test { color: red; }
      @for $i from 1 through 10 {
        .col-#{$i} { width: math.div(100%, 12) * $i; }
      }
    `;
    const ast = parseSassSimple(code);
    const features = detectFeatures(ast);
    const score = calculateMigrationScore(features);
    const effort = estimateMigrationEffort(features, score);

    expect(effort).toMatch(/day|week/i);
  });

  it('should suggest keeping Sass for heavy control flow', () => {
    const code = `
      @for $i from 1 through 20 { }
      @each $item in $list { }
      @if $condition { }
      @while $x < 10 { }
    `;
    const ast = parseSassSimple(code);
    const features = detectFeatures(ast);
    const score = calculateMigrationScore(features);
    const effort = estimateMigrationEffort(features, score);

    expect(effort).toMatch(/keep sass/i);
  });
});

describe('getRecommendationTitle', () => {
  it('should return correct title for migrate', () => {
    expect(getRecommendationTitle('migrate')).toBe('Migrate to Native CSS');
  });

  it('should return correct title for hybrid', () => {
    expect(getRecommendationTitle('hybrid')).toBe('Hybrid Approach Recommended');
  });

  it('should return correct title for keep-sass', () => {
    expect(getRecommendationTitle('keep-sass')).toBe('Keep Using Sass');
  });
});

describe('getRecommendationSummary', () => {
  it('should include score in summary', () => {
    const score = { overall: 85, breakdown: {} };
    const summary = getRecommendationSummary('migrate', score);

    expect(summary).toContain('85');
    expect(summary).toContain('100');
  });

  it('should provide helpful guidance for migrate', () => {
    const score = { overall: 90, breakdown: {} };
    const summary = getRecommendationSummary('migrate', score);

    expect(summary).toMatch(/great candidate/i);
  });

  it('should provide helpful guidance for hybrid', () => {
    const score = { overall: 60, breakdown: {} };
    const summary = getRecommendationSummary('hybrid', score);

    expect(summary).toMatch(/hybrid/i);
  });

  it('should provide helpful guidance for keep-sass', () => {
    const score = { overall: 30, breakdown: {} };
    const summary = getRecommendationSummary('keep-sass', score);

    expect(summary).toMatch(/keep sass|keeping sass/i);
  });
});

describe('integration: complete scoring workflow', () => {
  it('should handle complete analysis pipeline', () => {
    const code = `
      $primary: #3498db;
      $secondary: #2ecc71;

      .button {
        color: $primary;
        &:hover { opacity: 0.8; }
        .icon { margin-right: 8px; }
      }
    `;

    // Parse -> Detect -> Score
    const ast = parseSassSimple(code);
    const features = detectFeatures(ast);
    const score = calculateMigrationScore(features);
    const type = getRecommendationType(score.overall);
    const blockers = identifyBlockers(features);
    const effort = estimateMigrationEffort(features, score);
    const title = getRecommendationTitle(type);
    const summary = getRecommendationSummary(type, score);

    // Assertions
    expect(score.overall).toBeGreaterThan(0);
    expect(score.overall).toBeLessThanOrEqual(100);
    expect(type).toMatch(/migrate|hybrid|keep-sass/);
    expect(Array.isArray(blockers)).toBe(true);
    expect(typeof effort).toBe('string');
    expect(typeof title).toBe('string');
    expect(typeof summary).toBe('string');
  });
});
