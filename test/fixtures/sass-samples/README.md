# Sass Migration Calculator - Test Fixtures

This directory contains 15 test cases representing a spectrum of Sass code from simple to complex. Each test case is designed to validate different aspects of the Migration Calculator's feature detection and recommendation engine.

## Test Case Overview

| File | Complexity | Features Used | Expected Score | Expected Recommendation |
|------|-----------|---------------|----------------|------------------------|
| `01-simple-variables.scss` | Simple | Variables only | 95-100 | **MIGRATE** - Use CSS custom properties |
| `02-variables-nesting.scss` | Simple | Variables, basic nesting | 85-95 | **MIGRATE** - Use CSS custom properties + nesting |
| `03-deep-nesting.scss` | Moderate | Deep nesting (5 levels) | 60-75 | **HYBRID** - CSS nesting available but code smell |
| `04-simple-mixin.scss` | Moderate | Mixins (no params) | 50-65 | **HYBRID** - Can refactor to CSS classes |
| `05-mixin-with-params.scss` | Complex | Mixins with parameters | 15-25 | **KEEP SASS** - No CSS equivalent |
| `06-control-flow-loops.scss` | Complex | @for loops, interpolation | 5-15 | **KEEP SASS** - Programmatic generation |
| `07-control-flow-each.scss` | Complex | @each, maps | 5-15 | **KEEP SASS** - Programmatic generation |
| `08-control-flow-if.scss` | Complex | @if/@else, conditionals | 10-20 | **KEEP SASS** - No CSS equivalent |
| `09-custom-functions.scss` | Complex | @function, built-in modules | 5-15 | **KEEP SASS** - No CSS equivalent |
| `10-built-in-modules.scss` | Complex | sass:math, sass:color, etc. | 10-20 | **KEEP SASS** - No CSS equivalent |
| `11-maps-lists.scss` | Complex | Maps, lists, design tokens | 10-20 | **KEEP SASS** - No CSS equivalent |
| `12-extend-placeholders.scss` | Moderate | @extend, placeholders | 40-55 | **HYBRID** - Can refactor to classes |
| `13-interpolation.scss` | Complex | Interpolation (#{}) | 15-25 | **KEEP SASS** - Dynamic generation |
| `14-advanced-parent-selector.scss` | Moderate | Advanced & patterns | 45-60 | **HYBRID** - CSS has basic &, not advanced |
| `15-complex-real-world.scss` | Very Complex | All features combined | 0-10 | **KEEP SASS** - Design system example |

## Feature Categories

### 🟢 EASY MIGRATION (Scores: 80-100)
- **Test Cases:** 01, 02
- **Features:** Variables, basic nesting
- **CSS Alternatives:** CSS custom properties, CSS nesting
- **Recommendation:** Migrate to native CSS

### 🟡 MODERATE / HYBRID (Scores: 50-79)
- **Test Cases:** 03, 04, 12, 14
- **Features:** Deep nesting, simple mixins, @extend, advanced &
- **CSS Alternatives:** Partial or refactoring possible
- **Recommendation:** Hybrid approach or refactor

### 🔴 KEEP SASS (Scores: 0-49)
- **Test Cases:** 05, 06, 07, 08, 09, 10, 11, 13, 15
- **Features:** Mixins with params, control flow, functions, built-in modules, maps/lists
- **CSS Alternatives:** None
- **Recommendation:** Keep using Sass

## Usage in Tests

These fixtures should be used to validate:

1. **Parser Accuracy** - Can the parser correctly handle all syntax?
2. **Feature Detection** - Are all features correctly identified and counted?
3. **Scoring Algorithm** - Do scores fall within expected ranges?
4. **Recommendation Engine** - Are recommendations appropriate for the code?
5. **Edge Cases** - Deep nesting, complex interpolation, nested maps

## Expected Detection Patterns

### Test Case 01 (Simple Variables)
```javascript
{
  variables: { count: 4 },
  nesting: { count: 0 },
  mixins: { count: 0 },
  controlFlow: { count: 0 },
  // ... all other features: 0
}
```

### Test Case 05 (Mixins with Params)
```javascript
{
  mixins: {
    count: 2,
    withParameters: 2
  },
  variables: { count: 8 },
  controlFlow: { ifCount: 2 },
  // ... critical blocker detected
}
```

### Test Case 15 (Complex Real-World)
```javascript
{
  variables: { count: 15+ },
  mixins: { count: 2+, withParameters: 2+ },
  controlFlow: {
    forCount: 1+,
    eachCount: 2+,
    ifCount: 3+
  },
  functions: { count: 2+ },
  builtInModules: { modules: ['sass:math', 'sass:color', 'sass:map'] },
  maps: { count: 2+ },
  // ... multiple critical blockers
}
```

## Adding New Test Cases

When adding new test cases, follow this structure:

1. **Filename:** Use sequential numbering: `16-descriptive-name.scss`
2. **Comment Header:** Include expected score and recommendation
3. **Focus:** Each test should focus on specific feature combinations
4. **Documentation:** Update this README with the new test case

## Test Case Design Principles

- **Incremental Complexity:** Start simple, add features progressively
- **Real-World Relevance:** Patterns reflect actual Sass usage in production
- **Edge Cases:** Include challenging scenarios (deep nesting, complex interpolation)
- **Clear Expectations:** Each file documents expected analysis results
- **Comprehensive Coverage:** All 14 Sass features are represented across the suite
