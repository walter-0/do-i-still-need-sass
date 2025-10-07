/**
 * @typedef {object} SassFeature
 * @property {string} id - Unique identifier for the feature
 * @property {string} name - Display name of the Sass feature
 * @property {string} sassUrl - URL to Sass documentation
 * @property {string|null} webFeatureId - Corresponding web-features package ID
 * @property {'native'|'partial'|'none'} status - CSS implementation status
 * @property {string} [cssFeature] - Name of the equivalent CSS feature
 * @property {string} notes - Description or additional notes
 * @property {string} [mdn] - URL to MDN documentation
 * @property {string} [caniuse] - URL to Can I Use page
 * @property {Array<Link>} [links] - Additional reference links
 */

/**
 * @typedef {object} Link
 * @property {string} text - Link text to match in notes
 * @property {string} url - URL for the link
 */

/**
 * @typedef {object} BaselineData
 * @property {'high'|'low'|'limited'} level - Baseline support level
 * @property {boolean} available - Whether the feature is available
 * @property {string} [since] - ISO date when baseline support was achieved
 * @property {string} [lowSince] - ISO date when low baseline support was achieved
 * @property {object} support - Browser support data
 * @property {string} [label] - Human-readable label for the baseline level
 */

/**
 * @typedef {object} FeatureWithBaseline
 * @property {string} id - Unique identifier for the feature
 * @property {string} name - Display name of the Sass feature
 * @property {string} sassUrl - URL to Sass documentation
 * @property {string|null} webFeatureId - Corresponding web-features package ID
 * @property {'native'|'partial'|'none'} status - CSS implementation status
 * @property {string} [cssFeature] - Name of the equivalent CSS feature
 * @property {string} notes - Description or additional notes
 * @property {string} [mdn] - URL to MDN documentation
 * @property {string} [caniuse] - URL to Can I Use page
 * @property {Array<Link>} [links] - Additional reference links
 * @property {BaselineData|null} baseline - Browser support baseline data
 */

/**
 * @typedef {object} FeatureCounts
 * @property {number} native - Count of features with native CSS support
 * @property {number} partial - Count of features with partial CSS support
 * @property {number} none - Count of features with no CSS equivalent
 */
