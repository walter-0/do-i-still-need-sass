/**
 * @file Score comparison test - validates predicted vs actual scores
 * Run this to compare expected scores in fixture comments with actual calculator output
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSass } from '../../src/migration/parser.js';
import { detectFeatures } from '../../src/migration/detector.js';
import { calculateMigrationScore, getRecommendationType } from '../../src/migration/scorer.js';

const fixtures = [
  {
    file: '01-simple-variables.scss',
    expected: { min: 95, max: 100, type: 'migrate', description: 'Simple Variables Only' },
  },
  {
    file: '02-variables-nesting.scss',
    expected: { min: 85, max: 95, type: 'migrate', description: 'Variables + Basic Nesting' },
  },
  {
    file: '03-deep-nesting.scss',
    expected: { min: 60, max: 75, type: 'hybrid', description: 'Deep Nesting (5 levels)' },
  },
  {
    file: '04-simple-mixin.scss',
    expected: { min: 50, max: 65, type: 'hybrid', description: 'Simple Mixins (no parameters)' },
  },
  {
    file: '05-mixin-with-params.scss',
    expected: { min: 15, max: 25, type: 'keep-sass', description: 'Mixins with Parameters' },
  },
  {
    file: '06-control-flow-loops.scss',
    expected: { min: 5, max: 15, type: 'keep-sass', description: 'Control Flow - Loops' },
  },
  {
    file: '09-custom-functions.scss',
    expected: { min: 5, max: 15, type: 'keep-sass', description: 'Custom Functions' },
  },
  {
    file: '15-complex-real-world.scss',
    expected: { min: 0, max: 10, type: 'keep-sass', description: 'Complex Real-World Example' },
  },
];

const fixturesDir = join(process.cwd(), 'test', 'fixtures', 'sass-samples');

console.log('='.repeat(80));
console.log('SCORE COMPARISON: Predicted vs Actual');
console.log('='.repeat(80));
console.log();

let allPassed = true;

for (const fixture of fixtures) {
  const code = readFileSync(join(fixturesDir, fixture.file), 'utf-8');
  const parseResult = parseSass(code);

  if (!parseResult.success) {
    console.error(`❌ ${fixture.file}: Failed to parse`);
    allPassed = false;
    continue;
  }

  const features = detectFeatures(parseResult.ast);
  const score = calculateMigrationScore(features);
  const type = getRecommendationType(score.overall);

  const inRange = score.overall >= fixture.expected.min && score.overall <= fixture.expected.max;
  const typeMatch = type === fixture.expected.type;
  const passed = inRange && typeMatch;

  const status = passed ? '✅' : '⚠️';
  const rangeStatus = inRange ? '✓' : '✗';
  const typeStatus = typeMatch ? '✓' : '✗';

  console.log(`${status} ${fixture.file}`);
  console.log(`   Description: ${fixture.expected.description}`);
  console.log(`   Expected: ${fixture.expected.min}-${fixture.expected.max} (${fixture.expected.type})`);
  console.log(`   Actual:   ${score.overall} (${type})`);
  console.log(`   Score Range: ${rangeStatus} | Type Match: ${typeStatus}`);

  if (!passed) {
    allPassed = false;
    console.log(`   ⚠️  MISMATCH DETECTED`);
  }

  console.log();
}

console.log('='.repeat(80));
console.log(allPassed ? '✅ All scores match predictions!' : '⚠️  Some scores differ from predictions');
console.log('='.repeat(80));

process.exit(allPassed ? 0 : 1);
