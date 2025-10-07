// Mapping of Sass features to web-features package IDs and baseline data
import { features } from "web-features";

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

// Get baseline data for a feature
export function getBaselineData(featureId) {
  if (!featureId || !features[featureId]) {
    return null;
  }

  const feature = features[featureId];
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

// Get all features with their baseline data
export function getAllFeaturesWithBaseline() {
  return sassFeatures.map((feature) => ({
    ...feature,
    baseline: feature.webFeatureId ? getBaselineData(feature.webFeatureId) : null,
  }));
}
