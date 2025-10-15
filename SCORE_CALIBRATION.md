# Score Calibration Analysis

## Test Results Summary

Testing the migration calculator against 8 fixture files revealed scoring discrepancies:

| Fixture | Expected | Actual | Δ | Status |
|---------|----------|--------|---|--------|
| 01-simple-variables.scss | 95-100 (migrate) | **100** (migrate) | ✅ | PASS |
| 02-variables-nesting.scss | 85-95 (migrate) | **92** (migrate) | ✅ | PASS |
| 03-deep-nesting.scss | 60-75 (hybrid) | **80** (migrate) | ⚠️ +8 | FAIL - Too lenient |
| 04-simple-mixin.scss | 50-65 (hybrid) | **82** (migrate) | ⚠️ +17 | FAIL - Way too lenient |
| 05-mixin-with-params.scss | 15-25 (keep-sass) | **67** (hybrid) | ⚠️ +42 | FAIL - Critically too lenient |
| 06-control-flow-loops.scss | 5-15 (keep-sass) | **54** (hybrid) | ⚠️ +39 | FAIL - Critically too lenient |
| 09-custom-functions.scss | 5-15 (keep-sass) | **66** (hybrid) | ⚠️ +51 | FAIL - Critically too lenient |
| 15-complex-real-world.scss | 0-10 (keep-sass) | **43** (keep-sass) | ⚠️ +33 | FAIL - Type OK but score too high |

**Overall: 2/8 PASS (25%)**

## Key Issues Identified

### 1. Blocker Features Not Penalized Enough

The algorithm is not heavily penalizing "blocker" features that have **no CSS equivalent**:

- **Mixins with parameters** - Should drop score to <30, currently ~67
- **Control flow (@for, @each, @if, @while)** - Should drop score to <20, currently ~54
- **Custom functions** - Should drop score to <20, currently ~66
- **Built-in modules (sass:math, sass:color)** - Should drop score to <30, currently affected but not enough

### 2. Deep Nesting Not Penalized Enough

- 5+ levels of nesting should significantly impact the score
- Expected: 60-75 for deep nesting alone
- Actual: 80 (too high)

### 3. Simple Mixins Over-Scored

- Mixins without parameters (which can be refactored to CSS classes) score 82
- Should be in the 50-65 range (hybrid)
- These are moderate complexity, not easy migration

## Recommended Algorithm Adjustments

### Current Weights (from `scorer.js`)
```javascript
const defaultWeights = {
  variables: 1.0,
  nesting: 1.5,
  complexity: 2.0,
  blockers: 3.0,
};
```

### Proposed Changes

1. **Increase blocker weight from 3.0 to 5.0**
   - Blockers should have the most dramatic impact
   - These features have NO native CSS alternative

2. **More aggressive blocker penalties**
   ```javascript
   // Current penalty per feature:
   - Mixin definition: -5 per mixin
   - Function definition: -5 per function
   - Control flow: -5 per statement

   // Proposed:
   - Mixin definition with params: -15 per mixin
   - Mixin definition no params: -8 per mixin
   - Function definition: -15 per function
   - Control flow (@for, @each, @while): -15 per statement
   - Control flow (@if): -10 per statement
   - Built-in module: -12 per module
   ```

3. **Nesting depth penalty**
   ```javascript
   // Current: Linear penalty
   // Proposed: Exponential after depth 3
   - Depth 1-2: No penalty (native CSS nesting works fine)
   - Depth 3: -5 points
   - Depth 4: -10 points
   - Depth 5+: -15 points per level
   ```

4. **Interpolation penalty**
   ```javascript
   // Current: -2 per occurrence
   // Proposed: -5 per occurrence (no CSS equivalent)
   ```

5. **Color function penalty**
   ```javascript
   // Current: -3 per occurrence
   // Proposed: -8 per occurrence (requires color-mix() or manual calculation)
   ```

## Expected Scores After Calibration

| Fixture | Current | Target | Adjustment Needed |
|---------|---------|--------|-------------------|
| 03-deep-nesting.scss | 80 | 60-75 | -5 to -20 |
| 04-simple-mixin.scss | 82 | 50-65 | -17 to -32 |
| 05-mixin-with-params.scss | 67 | 15-25 | -42 to -52 |
| 06-control-flow-loops.scss | 54 | 5-15 | -39 to -49 |
| 09-custom-functions.scss | 66 | 5-15 | -51 to -61 |
| 15-complex-real-world.scss | 43 | 0-10 | -33 to -43 |

## Testing Plan

1. Implement adjusted penalties in `src/migration/scorer.js`
2. Re-run `node test/fixtures/score-comparison.js`
3. Iterate until 7/8 or 8/8 fixtures pass
4. Test with real-world Sass codebases to validate

## Notes

The algorithm is correctly identifying easy migrations (variables, simple nesting) but fails to recognize truly difficult migrations. This could lead users to underestimate migration complexity for codebases with:

- Extensive mixin systems (component libraries, design systems)
- Control flow for utility generation (Tailwind-like patterns)
- Complex custom functions (mathematical calculations, color manipulation)
- Deep built-in module usage (sass:math, sass:color, sass:string)

**Priority: HIGH** - Fix before public release to avoid misleading users.
