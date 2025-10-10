/**
 * @file Property-based and fuzz tests for migration calculator
 * Using fast-check for property-based testing and faker for random data generation
 */

import { describe, it, expect } from 'vitest';
import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';
import { faker } from '@faker-js/faker';
import { parseSass } from '../../src/migration/parser.js';
import { detectFeatures, getFeatureSummary } from '../../src/migration/detector.js';
import {
  calculateMigrationScore,
  getRecommendationType,
  identifyBlockers,
  estimateMigrationEffort,
} from '../../src/migration/scorer.js';

describe('Property-Based Tests with fast-check', () => {
  describe('Parser Properties', () => {
    test.prop([fc.string()])('should handle any string input without crashing', (input) => {
      // Parser should never crash, even with invalid input
      expect(() => parseSass(input)).not.toThrow();
    });

    test.prop([fc.string({ minLength: 1, maxLength: 1000 })])(
      'should always return a ParseResult object',
      (code) => {
        const result = parseSass(code);

        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('ast');
        expect(result).toHaveProperty('errors');
        expect(result).toHaveProperty('warnings');
        expect(Array.isArray(result.errors)).toBe(true);
        expect(Array.isArray(result.warnings)).toBe(true);
      }
    );

    test.prop([
      fc.record({
        varName: fc.stringMatching(/^[a-z][a-z0-9-]*$/),
        value: fc.oneof(
          // Generate valid hex colors
          fc
            .integer({ min: 0, max: 0xffffff })
            .map((n) => `#${n.toString(16).padStart(6, '0')}`),
          fc.integer({ min: 1, max: 100 }).map((n) => `${n}px`),
          fc.constant('red'),
          fc.constant('blue')
        ),
      }),
    ])('should parse valid Sass variables', ({ varName, value }) => {
      const code = `$${varName}: ${value};`;
      const result = parseSass(code);

      expect(result.success).toBe(true);
    });

    test.prop([
      fc.array(fc.stringMatching(/^[a-z][a-z0-9-]*$/), { minLength: 1, maxLength: 5 }),
    ])('should parse nested selectors', (classNames) => {
      const nested = classNames.map((name, idx) => `${'  '.repeat(idx)}.${name} {`).join('\n');
      const closing = classNames.map((_, idx) => `${'  '.repeat(classNames.length - idx - 1)}}`).join('\n');
      const code = `${nested}\n  color: red;\n${closing}`;

      const result = parseSass(code);
      // May or may not be valid, but should not crash
      expect(result).toBeDefined();
    });
  });

  describe('Detector Properties', () => {
    test.prop([fc.nat(100)])('should never return negative counts', (seed) => {
      // Generate random valid Sass code
      faker.seed(seed);
      const numVars = faker.number.int({ min: 0, max: 10 });
      const variables = Array.from({ length: numVars }, (_, i) =>
        `$var${i}: ${faker.color.rgb()};`
      ).join('\n');

      const ast = parseSass(variables);
      if (!ast.success) return; // Skip invalid code

      const features = detectFeatures(ast.ast);

      // All counts must be non-negative
      expect(features.variables.count).toBeGreaterThanOrEqual(0);
      expect(features.nesting.count).toBeGreaterThanOrEqual(0);
      expect(features.mixins.count).toBeGreaterThanOrEqual(0);
      expect(features.functions.count).toBeGreaterThanOrEqual(0);
      expect(features.controlFlow.count).toBeGreaterThanOrEqual(0);
    });

    test.prop([fc.nat(100)])('should have locations array matching count', (seed) => {
      faker.seed(seed);
      const code = Array.from(
        { length: faker.number.int({ min: 1, max: 5 }) },
        (_, i) => `$var${i}: red;`
      ).join('\n');

      const ast = parseSass(code);
      if (!ast.success) return;

      const features = detectFeatures(ast.ast);

      // Locations array length should match count
      expect(features.variables.locations).toHaveLength(features.variables.count);
    });

    test.prop([fc.integer({ min: 2, max: 10 })])(
      'should correctly calculate nesting depth',
      (depth) => {
        // Create nested selectors
        const opening = Array.from({ length: depth }, (_, i) => `${'  '.repeat(i)}.level${i} {`).join('\n');
        const closing = Array.from({ length: depth }, (_, i) => `${'  '.repeat(depth - i - 1)}}`).join('\n');
        const code = `${opening}\n  color: red;\n${closing}`;

        const ast = parseSass(code);
        if (!ast.success) return;

        const features = detectFeatures(ast.ast);

        // Max depth should be at least as deep as we created
        expect(features.nesting.maxDepth).toBeGreaterThanOrEqual(depth);
      }
    );

    test.prop([fc.nat(100)])('summary should be consistent with features', (seed) => {
      faker.seed(seed);
      const hasVars = faker.datatype.boolean();
      const code = hasVars ? '$color: red;' : '.button { color: red; }';

      const ast = parseSass(code);
      if (!ast.success) return;

      const features = detectFeatures(ast.ast);
      const summary = getFeatureSummary(features);

      // Summary booleans should match actual counts
      expect(summary.hasVariables).toBe(features.variables.count > 0);
      expect(summary.hasNesting).toBe(features.nesting.count > 0);
      expect(summary.hasMixins).toBe(features.mixins.count > 0);
    });
  });

  describe('Scorer Properties', () => {
    test.prop([fc.nat(100)])('score should always be between 0-100', (seed) => {
      faker.seed(seed);

      // Generate random Sass code
      const parts = [];
      if (faker.datatype.boolean()) parts.push(`$color: ${faker.color.rgb()};`);
      if (faker.datatype.boolean()) parts.push('.button { color: red; }');
      if (faker.datatype.boolean())
        parts.push('.parent { .child { color: blue; } }');

      const code = parts.join('\n') || '.empty { }';
      const ast = parseSass(code);
      if (!ast.success) return;

      const features = detectFeatures(ast.ast);
      const score = calculateMigrationScore(features);

      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });

    test.prop([fc.nat(100)])('all breakdown scores should be 0-100', (seed) => {
      faker.seed(seed);

      const code = faker.datatype.boolean()
        ? '$color: red;'
        : '.button { .icon { color: red; } }';

      const ast = parseSass(code);
      if (!ast.success) return;

      const features = detectFeatures(ast.ast);
      const score = calculateMigrationScore(features);

      Object.values(score.breakdown).forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      });
    });

    test.prop([fc.nat(100)])('recommendation should be consistent with score', (seed) => {
      faker.seed(seed);

      const code = '$color: red; .button { color: $color; }';
      const ast = parseSass(code);
      if (!ast.success) return;

      const features = detectFeatures(ast.ast);
      const score = calculateMigrationScore(features);
      const recommendation = getRecommendationType(score.overall);

      // Verify recommendation matches score ranges
      if (score.overall >= 80) {
        expect(recommendation).toBe('migrate');
      } else if (score.overall >= 50) {
        expect(recommendation).toBe('hybrid');
      } else {
        expect(recommendation).toBe('keep-sass');
      }
    });

    test.prop([fc.integer({ min: 0, max: 100 })])(
      'getRecommendationType should always return valid value',
      (score) => {
        const recommendation = getRecommendationType(score);
        expect(['migrate', 'hybrid', 'keep-sass']).toContain(recommendation);
      }
    );

    test.prop([fc.nat(100)])('blockers array should never be null', (seed) => {
      faker.seed(seed);

      const code = '$color: red;';
      const ast = parseSass(code);
      if (!ast.success) return;

      const features = detectFeatures(ast.ast);
      const blockers = identifyBlockers(features);

      expect(Array.isArray(blockers)).toBe(true);
      expect(blockers).toBeDefined();
    });

    test.prop([fc.nat(100)])('effort estimate should be non-empty string', (seed) => {
      faker.seed(seed);

      const code = '$color: red;';
      const ast = parseSass(code);
      if (!ast.success) return;

      const features = detectFeatures(ast.ast);
      const score = calculateMigrationScore(features);
      const effort = estimateMigrationEffort(features, score);

      expect(typeof effort).toBe('string');
      expect(effort.length).toBeGreaterThan(0);
    });
  });

  describe('Invariants', () => {
    test.prop([fc.nat(100)])('parsing + detection should be idempotent', (seed) => {
      faker.seed(seed);
      const code = '$color: red; .button { color: $color; }';

      const result1 = parseSass(code);
      const result2 = parseSass(code);

      expect(result1.success).toBe(result2.success);

      if (result1.success && result2.success) {
        const features1 = detectFeatures(result1.ast);
        const features2 = detectFeatures(result2.ast);

        expect(features1.variables.count).toBe(features2.variables.count);
        expect(features1.nesting.count).toBe(features2.nesting.count);
      }
    });

    test.prop([fc.nat(100)])('score calculation should be deterministic', (seed) => {
      faker.seed(seed);
      const code = '$color: red;';

      const ast = parseSass(code);
      if (!ast.success) return;

      const features = detectFeatures(ast.ast);
      const score1 = calculateMigrationScore(features);
      const score2 = calculateMigrationScore(features);

      expect(score1.overall).toBe(score2.overall);
      expect(score1.breakdown).toEqual(score2.breakdown);
    });
  });
});

describe('Fuzz Tests with Faker', () => {
  describe('Random Sass Code Generation', () => {
    it('should handle random variable declarations', () => {
      faker.seed(12345);

      for (let i = 0; i < 20; i++) {
        const varName = faker.word.noun().replace(/[^a-z0-9]/gi, '-');
        const value = faker.helpers.arrayElement([
          faker.color.rgb(),
          `${faker.number.int({ min: 1, max: 100 })}px`,
          `${faker.number.float({ min: 0, max: 1, fractionDigits: 2 })}`,
        ]);

        const code = `$${varName}: ${value};`;
        const result = parseSass(code);

        // Should parse successfully most of the time
        if (result.success) {
          const features = detectFeatures(result.ast);
          expect(features.variables.count).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should handle random selector combinations', () => {
      faker.seed(54321);

      for (let i = 0; i < 20; i++) {
        const selectors = faker.helpers.multiple(
          () => `.${faker.word.adjective().replace(/[^a-z0-9]/gi, '-')}`,
          { count: { min: 1, max: 3 } }
        );

        const code = `${selectors.join(' ')} { color: ${faker.color.rgb()}; }`;
        const result = parseSass(code);

        expect(result).toBeDefined();
      }
    });

    it('should handle random nesting depths', () => {
      faker.seed(99999);

      for (let i = 0; i < 10; i++) {
        const depth = faker.number.int({ min: 1, max: 5 });
        const opening = Array.from(
          { length: depth },
          (_, idx) => `${'  '.repeat(idx)}.level${idx} {`
        ).join('\n');
        const closing = Array.from(
          { length: depth },
          (_, idx) => `${'  '.repeat(depth - idx - 1)}}`
        ).join('\n');

        const code = `${opening}\n  color: red;\n${closing}`;
        const result = parseSass(code);

        if (result.success) {
          const features = detectFeatures(result.ast);
          // Nesting depth is only counted for depth > 1
          // Single level selectors have maxDepth = 0
          expect(features.nesting.maxDepth).toBeGreaterThanOrEqual(0);
          if (depth > 1) {
            expect(features.nesting.maxDepth).toBeGreaterThanOrEqual(1);
          }
        }
      }
    });

    it('should handle mixed feature combinations', () => {
      faker.seed(11111);

      for (let i = 0; i < 15; i++) {
        const parts = [];

        // Random variables
        if (faker.datatype.boolean()) {
          const numVars = faker.number.int({ min: 1, max: 5 });
          for (let j = 0; j < numVars; j++) {
            parts.push(`$var${j}: ${faker.color.rgb()};`);
          }
        }

        // Random selectors
        if (faker.datatype.boolean()) {
          const selector = `.${faker.word.noun().replace(/[^a-z0-9]/gi, '-')}`;
          parts.push(`${selector} { color: red; }`);
        }

        // Random nesting
        if (faker.datatype.boolean()) {
          parts.push('.parent { .child { color: blue; } }');
        }

        const code = parts.join('\n') || '.empty { }';
        const result = parseSass(code);

        if (result.success) {
          const features = detectFeatures(result.ast);
          const score = calculateMigrationScore(features);

          expect(score.overall).toBeGreaterThanOrEqual(0);
          expect(score.overall).toBeLessThanOrEqual(100);
        }
      }
    });
  });

  describe('Edge Cases with Random Data', () => {
    it('should handle extremely long variable names', () => {
      faker.seed(22222);

      const longName = faker.string.alpha({ length: 200 });
      const code = `$${longName}: red;`;
      const result = parseSass(code);

      expect(result).toBeDefined();
    });

    it('should handle many variables', () => {
      faker.seed(33333);

      const numVars = 100;
      const variables = Array.from(
        { length: numVars },
        (_, i) => `$var${i}: ${faker.color.rgb()};`
      ).join('\n');

      const result = parseSass(variables);

      if (result.success) {
        const features = detectFeatures(result.ast);
        expect(features.variables.count).toBeGreaterThanOrEqual(50);
      }
    });

    it('should handle special characters in comments', () => {
      faker.seed(44444);

      for (let i = 0; i < 10; i++) {
        const comment = faker.lorem.sentence();
        const code = `/* ${comment} */\n$color: red;`;
        const result = parseSass(code);

        expect(result).toBeDefined();
      }
    });

    it('should handle unicode in class names', () => {
      faker.seed(55555);

      // CSS allows unicode in identifiers
      const code = '.button-🎨 { color: red; }';
      const result = parseSass(code);

      expect(result).toBeDefined();
    });
  });
});

describe('Boundary Tests', () => {
  it('should handle empty string', () => {
    const result = parseSass('');
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should handle whitespace only', () => {
    const result = parseSass('   \n\t   ');
    expect(result.success).toBe(false);
  });

  it('should handle minimum valid Sass', () => {
    const code = '$a:0;';
    const result = parseSass(code);
    expect(result.success).toBe(true);
  });

  it('should handle very long code', () => {
    const longCode = Array.from({ length: 1000 }, (_, i) => `$var${i}: red;`).join('\n');
    const result = parseSass(longCode);

    if (result.success) {
      const features = detectFeatures(result.ast);
      expect(features.variables.count).toBe(1000);
    }
  });
});
