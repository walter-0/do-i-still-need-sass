// Mapping of Sass features to web-features package IDs and baseline data
import { features } from "web-features";

/**
 * @import {SassFeature, FeatureWithBaseline, BaselineData} from './types.ts'
 */

/**
 * @type {Array<SassFeature>}
 */
export const sassFeatures = [
  {
    id: "variables",
    name: "Variables",
    sassUrl: "https://sass-lang.com/documentation/variables",
    webFeatureId: "custom-properties",
    status: "native",
    cssFeature: "CSS Custom Properties",
    notes: " are more dynamic and can be updated at runtime.",
    mdn: "https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties",
    example: {
      sass: `$primary-color: #3498db;
$padding: 16px;

.button {
  background-color: $primary-color;
  padding: $padding;
}`,
      css: `:root {
  --primary-color: #3498db;
  --padding: 16px;
}

.button {
  background-color: var(--primary-color);
  padding: var(--padding);
}`,
    },
  },
  {
    id: "partials-import",
    name: "Partials & @import",
    sassUrl: "https://sass-lang.com/documentation/at-rules/import",
    webFeatureId: "import",
    status: "native",
    cssFeature: "@import",
    notes: ", though Sass offers a more advanced module system.",
    mdn: "https://developer.mozilla.org/en-US/docs/Web/CSS/@import",
    example: {
      sass: `// _variables.scss
$primary-color: #3498db;

// main.scss
@import 'variables';

.button {
  background-color: $primary-color;
}`,
      css: `/* variables.css */
:root {
  --primary-color: #3498db;
}

/* main.css */
@import url('variables.css');

.button {
  background-color: var(--primary-color);
}`,
    },
  },
  {
    id: "nesting",
    name: "Nesting",
    sassUrl: "https://sass-lang.com/documentation/style-rules/nesting",
    webFeatureId: "nesting",
    status: "native",
    cssFeature: "CSS Nesting Module",
    notes: " is now widely supported across modern browsers.",
    mdn: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting",
    caniuse: "https://caniuse.com/css-nesting",
    example: {
      sass: `.card {
  padding: 20px;

  h2 {
    font-size: 24px;
    margin-bottom: 10px;
  }

  &:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
}`,
      css: `.card {
  padding: 20px;

  & h2 {
    font-size: 24px;
    margin-bottom: 10px;
  }

  &:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
}`,
    },
  },
  {
    id: "operators",
    name: "Operators",
    sassUrl: "https://sass-lang.com/documentation/operators",
    webFeatureId: "calc",
    status: "partial",
    cssFeature: "calc()",
    notes: " supports math operations, but Sass offers more comprehensive operators.",
    mdn: "https://developer.mozilla.org/en-US/docs/Web/CSS/calc",
    whatsDifferent:
      "Sass operators (+, -, *, /, %) work at compile-time and can operate on variables directly, while CSS calc() runs at runtime but requires wrapping every operation. Sass also supports comparison operators (==, !=, <, >, <=, >=), logical operators (and, or, not), and string concatenation, which CSS doesn't have.",
    example: {
      sass: `$base-size: 16px;

.container {
  width: $base-size * 20;
  padding: $base-size / 2;
  margin: $base-size + 8px;
}`,
      css: `.container {
  width: calc(16px * 20);
  padding: calc(16px / 2);
  margin: calc(16px + 8px);
}`,
    },
  },
  {
    id: "functions",
    name: "Functions",
    sassUrl: "https://sass-lang.com/documentation/functions",
    webFeatureId: null, // CSS has built-in functions but no custom user-defined functions
    status: "partial",
    cssFeature: "built-in functions",
    notes: ", but not custom user-defined functions.",
    mdn: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Functions",
    whatsDifferent:
      "CSS has many built-in functions (calc(), color-mix(), clamp(), min(), max(), etc.) but doesn't support custom user-defined functions like Sass's @function. Sass also has extensive built-in functions for color manipulation (darken(), lighten(), transparentize()), string operations, list/map manipulation, and more that have no CSS equivalent.",
    example: {
      sass: `// Custom function in Sass
@function px-to-rem($px) {
  @return $px / 16px * 1rem;
}

.text {
  font-size: px-to-rem(24px); // 1.5rem
  margin: px-to-rem(16px);    // 1rem
}

// Built-in functions
.color {
  background: darken(#3498db, 10%);
  color: lighten(#2c3e50, 20%);
}`,
      css: `/* No custom functions in CSS */
/* Must use calc() or hardcode values */

.text {
  font-size: calc(24 / 16 * 1rem); /* 1.5rem */
  margin: calc(16 / 16 * 1rem);    /* 1rem */
}

/* CSS has some built-in functions */
.color {
  background: color-mix(in srgb, #3498db, black 10%);
  color: color-mix(in srgb, #2c3e50, white 20%);
}`,
    },
  },
  {
    id: "modules",
    name: "Modules (@use)",
    sassUrl: "https://sass-lang.com/documentation/at-rules/use",
    webFeatureId: null,
    status: "none",
    notes: "The modern way to manage dependencies and namespaces in Sass.",
    example: {
      sass: `// _colors.scss
$primary: #3498db;
$secondary: #2ecc71;

// _mixins.scss
@mixin flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

// main.scss
@use 'colors';
@use 'mixins';

.button {
  background: colors.$primary;
  @include mixins.flex-center;
}`,
      css: `/* No module system in CSS */
/* Must rely on @import or manual organization */

/* colors.css */
:root {
  --primary: #3498db;
  --secondary: #2ecc71;
}

/* main.css */
@import url('colors.css');

.button {
  background: var(--primary);
  display: flex;
  justify-content: center;
  align-items: center;
}`,
    },
  },
  {
    id: "built-in-modules",
    name: "Built-in Modules",
    sassUrl: "https://sass-lang.com/documentation/modules",
    webFeatureId: null,
    status: "none",
    notes: "Sass provides powerful modules like sass:math and sass:color.",
    example: {
      sass: `@use 'sass:math';
@use 'sass:color';
@use 'sass:list';

.container {
  // sass:math
  width: math.div(960px, 12); // 80px
  height: math.round(99.7px); // 100px

  // sass:color
  background: color.scale(#3498db, $lightness: 20%);
  border: 1px solid color.adjust(#3498db, $alpha: -0.5);

  // sass:list
  $sizes: 10px, 20px, 30px;
  padding: list.nth($sizes, 2); // 20px
}`,
      css: `/* No built-in modules in CSS */
/* Limited alternatives available */

.container {
  /* Math operations with calc() */
  width: calc(960px / 12); /* 80px */
  height: 100px; /* Manual rounding */

  /* Color manipulation with newer functions */
  background: color-mix(in srgb, #3498db, white 20%);
  border: 1px solid rgb(from #3498db r g b / 0.5);

  /* No list manipulation */
  padding: 20px; /* Manual value */
}`,
    },
  },
  {
    id: "value-types",
    name: "Value Types",
    sassUrl: "https://sass-lang.com/documentation/values",
    webFeatureId: null,
    status: "none",
    notes: "Sass supports advanced data types like maps and lists.",
    links: [
      { text: "maps", url: "https://sass-lang.com/documentation/values/maps" },
      { text: "lists", url: "https://sass-lang.com/documentation/values/lists" },
    ],
    example: {
      sass: `// Maps
$colors: (
  primary: #3498db,
  secondary: #2ecc71,
  danger: #e74c3c
);

// Lists
$sizes: 12px, 16px, 20px, 24px;

.alert {
  background: map-get($colors, danger);
  font-size: nth($sizes, 2); // 16px
}

// Iterate over map
@each $name, $color in $colors {
  .btn-#{$name} {
    background: $color;
  }
}`,
      css: `/* No map or list data structures */
/* Must use individual variables */

:root {
  --color-primary: #3498db;
  --color-secondary: #2ecc71;
  --color-danger: #e74c3c;
  --size-1: 12px;
  --size-2: 16px;
  --size-3: 20px;
  --size-4: 24px;
}

.alert {
  background: var(--color-danger);
  font-size: var(--size-2); /* 16px */
}

/* Manual class creation */
.btn-primary { background: var(--color-primary); }
.btn-secondary { background: var(--color-secondary); }
.btn-danger { background: var(--color-danger); }`,
    },
  },
  {
    id: "mixins",
    name: "Mixins",
    sassUrl: "https://sass-lang.com/documentation/at-rules/mixin",
    webFeatureId: null,
    status: "none",
    notes: "No direct CSS equivalent for reusable blocks of styles with arguments.",
    example: {
      sass: `@mixin button-style($bg-color, $text-color) {
  background-color: $bg-color;
  color: $text-color;
  padding: 10px 20px;
  border-radius: 4px;
}

.primary-btn {
  @include button-style(#3498db, white);
}

.danger-btn {
  @include button-style(#e74c3c, white);
}`,
      css: `/* No direct CSS equivalent */
/* You would need to write styles manually: */

.primary-btn {
  background-color: #3498db;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
}

.danger-btn {
  background-color: #e74c3c;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
}`,
    },
  },
  {
    id: "extend",
    name: "@extend",
    sassUrl: "https://sass-lang.com/documentation/at-rules/extend",
    webFeatureId: null,
    status: "none",
    notes: "No feature for inheriting styles from other selectors.",
    example: {
      sass: `%message-shared {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.success {
  @extend %message-shared;
  border-color: #2ecc71;
  background: #d5f4e6;
}

.error {
  @extend %message-shared;
  border-color: #e74c3c;
  background: #fadbd8;
}`,
      css: `/* No @extend - must duplicate or use multiple classes */

/* Option 1: Duplicate styles */
.success {
  padding: 10px;
  border: 1px solid #2ecc71;
  border-radius: 4px;
  background: #d5f4e6;
}

.error {
  padding: 10px;
  border: 1px solid #e74c3c;
  border-radius: 4px;
  background: #fadbd8;
}

/* Option 2: Multiple classes in HTML */
/* <div class="message success"> */`,
    },
  },
  {
    id: "control-flow",
    name: "Control Flow",
    sassUrl: "https://sass-lang.com/documentation/at-rules/control",
    webFeatureId: null,
    status: "none",
    notes: "No equivalent for conditional logic (@if) or loops (@for, @each) in CSS.",
    example: {
      sass: `// @if conditional
@mixin theme-colors($theme) {
  @if $theme == 'dark' {
    background: #333;
    color: #fff;
  } @else {
    background: #fff;
    color: #333;
  }
}

// @for loop
@for $i from 1 through 4 {
  .col-#{$i} {
    width: calc(100% / 4 * $i);
  }
}

// @each loop
$colors: red, blue, green;
@each $color in $colors {
  .text-#{$color} {
    color: $color;
  }
}`,
      css: `/* No control flow in CSS */
/* Must write everything manually */

/* Manual theme variants */
.theme-dark {
  background: #333;
  color: #fff;
}
.theme-light {
  background: #fff;
  color: #333;
}

/* Manual column classes */
.col-1 { width: 25%; }
.col-2 { width: 50%; }
.col-3 { width: 75%; }
.col-4 { width: 100%; }

/* Manual color classes */
.text-red { color: red; }
.text-blue { color: blue; }
.text-green { color: green; }`,
    },
  },
  {
    id: "interpolation",
    name: "Interpolation",
    sassUrl: "https://sass-lang.com/documentation/interpolation",
    webFeatureId: null,
    status: "none",
    notes: "No equivalent for embedding expressions within selectors or property names.",
    example: {
      sass: `$position: top;
$prefix: btn;

// Interpolation in selectors
.#{$prefix}-primary {
  background: blue;
}

// Interpolation in property names
.box {
  border-#{$position}: 2px solid black;
  margin-#{$position}: 10px;
}

// In URLs and strings
$image-path: '/images';
.hero {
  background-image: url('#{$image-path}/hero.jpg');
}`,
      css: `/* No interpolation in CSS */
/* Must write complete values */

.btn-primary {
  background: blue;
}

.box {
  border-top: 2px solid black;
  margin-top: 10px;
}

.hero {
  background-image: url('/images/hero.jpg');
}`,
    },
  },
  {
    id: "parent-selector",
    name: "Parent Selector (&)",
    sassUrl: "https://sass-lang.com/documentation/style-rules/parent-selector",
    webFeatureId: null,
    status: "none",
    notes: "The & is part of the CSS Nesting spec, but Sass provides more advanced usage patterns.",
    example: {
      sass: `// Basic usage (CSS nesting has this)
.button {
  &:hover {
    opacity: 0.8;
  }
}

// Advanced: Adding suffixes (Sass only)
.button {
  &-primary { background: blue; }
  &-secondary { background: green; }
  &-large { padding: 20px; }
}

// Advanced: Selector manipulation (Sass only)
.theme-dark {
  .button {
    background: #333;

    .theme-light & {
      background: #fff;
    }
  }
}`,
      css: `/* Basic & works in CSS nesting */
.button {
  &:hover {
    opacity: 0.8;
  }
}

/* No suffix addition - must write full selectors */
.button-primary { background: blue; }
.button-secondary { background: green; }
.button-large { padding: 20px; }

/* No advanced selector manipulation */
.theme-dark .button {
  background: #333;
}

.theme-light .theme-dark .button {
  background: #fff;
}`,
    },
  },
  {
    id: "placeholders",
    name: "Placeholders (%)",
    sassUrl: "https://sass-lang.com/documentation/placeholder-selectors",
    webFeatureId: null,
    status: "none",
    notes: "No equivalent for creating styles that are only output when extended.",
    example: {
      sass: `// Placeholder is not output unless extended
%button-base {
  display: inline-block;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.primary-button {
  @extend %button-base;
  background: blue;
  color: white;
}

.secondary-button {
  @extend %button-base;
  background: gray;
  color: white;
}

// Output: only .primary-button and .secondary-button
// %button-base is NOT in the final CSS`,
      css: `/* No placeholder concept */
/* Either duplicate or create actual classes */

/* Option 1: Create a real class */
.button-base {
  display: inline-block;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.primary-button {
  display: inline-block;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  background: blue;
  color: white;
}

/* Option 2: Use .button-base in HTML */
/* <button class="button-base primary-button"> */`,
    },
  },
];

/**
 * Retrieves baseline browser support data for a given web feature.
 * @param {string} featureId - The web-features package feature identifier
 * @returns {BaselineData|null} Baseline data object with level, availability, and support info
 */
export function getBaselineData(featureId) {
  if (!featureId || !features[featureId]) {
    return null;
  }

  const feature = features[featureId];

  if (feature.kind !== "feature") {
    return null;
  }

  const status = feature.status;

  if (!status.baseline) {
    return {
      level: "limited",
      available: false,
      support: status.support,
    };
  }

  // baseline can be 'high' (widely available), 'low' (newly available), or false (limited)
  if (status.baseline === "high") {
    return {
      level: "high",
      available: true,
      since: status.baseline_high_date,
      lowSince: status.baseline_low_date,
      support: status.support,
      label: "Widely available",
    };
  }

  if (status.baseline === "low") {
    return {
      level: "low",
      available: true,
      since: status.baseline_low_date,
      support: status.support,
      label: "Newly available",
    };
  }

  return {
    level: "limited",
    available: false,
    support: status.support,
    label: "Limited availability",
  };
}

/**
 * Gets all Sass features enriched with their baseline browser support data.
 * @returns {Array<FeatureWithBaseline>} Array of feature objects with baseline data included
 */
export function getAllFeaturesWithBaseline() {
  return sassFeatures.map((feature) => ({
    ...feature,
    baseline: feature.webFeatureId ? getBaselineData(feature.webFeatureId) : null,
  }));
}
