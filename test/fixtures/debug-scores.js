import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSass } from '../../src/migration/parser.js';
import { detectFeatures } from '../../src/migration/detector.js';
import { calculateMigrationScore } from '../../src/migration/scorer.js';

const fixtures = [
  '03-deep-nesting.scss',
  '05-mixin-with-params.scss',
  '06-control-flow-loops.scss',
];

const fixturesDir = join(process.cwd(), 'test', 'fixtures', 'sass-samples');

for (const file of fixtures) {
  console.log('\n' + '='.repeat(60));
  console.log(file);
  console.log('='.repeat(60));

  const code = readFileSync(join(fixturesDir, file), 'utf-8');
  const parseResult = parseSass(code);
  const features = detectFeatures(parseResult.ast);
  const score = calculateMigrationScore(features);

  console.log('\nFeatures detected:');
  console.log('  Variables:', features.variables.count);
  console.log('  Nesting:', features.nesting.count, '(max depth:', features.nesting.maxDepth + ')');
  console.log('  Mixins:', features.mixins.definitions, 'definitions,', features.mixins.usages, 'usages');
  console.log('  Functions:', features.functions.definitions, 'definitions,', features.functions.usages, 'usages');
  console.log('  Control flow:', features.controlFlow.count);
  console.log('  Interpolation:', features.interpolation.count);
  console.log('  Color functions:', features.colorFunctions.count);
  console.log('  Built-in modules:', features.builtInModules.count);

  console.log('\nScore breakdown:');
  console.log('  Variables:', score.breakdown.variables);
  console.log('  Nesting:', score.breakdown.nesting);
  console.log('  Complexity:', score.breakdown.complexity);
  console.log('  Blockers:', score.breakdown.blockers);
  console.log('  Overall:', score.overall);
}
