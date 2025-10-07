// Mapping of Sass features to web-features package IDs and baseline data
import { features } from "web-features";

/**
 * @import {SassFeature, FeatureWithBaseline, BaselineData} from './typedefs.js'
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
  },
  {
    id: "modules",
    name: "Modules (@use)",
    sassUrl: "https://sass-lang.com/documentation/at-rules/use",
    webFeatureId: null,
    status: "none",
    notes: "The modern way to manage dependencies and namespaces in Sass.",
  },
  {
    id: "built-in-modules",
    name: "Built-in Modules",
    sassUrl: "https://sass-lang.com/documentation/modules",
    webFeatureId: null,
    status: "none",
    notes: "Sass provides powerful modules like sass:math and sass:color.",
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
  },
  {
    id: "control-flow",
    name: "Control Flow",
    sassUrl: "https://sass-lang.com/documentation/at-rules/control",
    webFeatureId: null,
    status: "none",
    notes: "No equivalent for conditional logic (@if) or loops (@for, @each) in CSS.",
  },
  {
    id: "interpolation",
    name: "Interpolation",
    sassUrl: "https://sass-lang.com/documentation/interpolation",
    webFeatureId: null,
    status: "none",
    notes: "No equivalent for embedding expressions within selectors or property names.",
  },
  {
    id: "parent-selector",
    name: "Parent Selector (&)",
    sassUrl: "https://sass-lang.com/documentation/style-rules/parent-selector",
    webFeatureId: null,
    status: "none",
    notes: "The & is part of the CSS Nesting spec, but Sass provides more advanced usage patterns.",
  },
  {
    id: "placeholders",
    name: "Placeholders (%)",
    sassUrl: "https://sass-lang.com/documentation/placeholder-selectors",
    webFeatureId: null,
    status: "none",
    notes: "No equivalent for creating styles that are only output when extended.",
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
