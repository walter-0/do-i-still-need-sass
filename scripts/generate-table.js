import { getAllFeaturesWithBaseline } from "../src/feature-data.js";
import "../src/typedefs.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates a baseline badge HTML element based on browser support level.
 * @param {BaselineData|null} baseline - Baseline data with level and since properties
 * @returns {string} HTML string for the baseline badge
 */
function baselineBadge(baseline) {
  if (!baseline) {
    return "";
  }

  const badges = {
    high: {
      color: "emerald",
      icon: `<svg class="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 0L8.854 5.146L14 7L8.854 8.854L7 14L5.146 8.854L0 7L5.146 5.146L7 0Z" fill="currentColor"/>
      </svg>`,
      label: "Widely available",
      year: new Date(baseline.since).getFullYear(),
    },
    low: {
      color: "blue",
      icon: `<svg class="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 0L8.854 5.146L14 7L8.854 8.854L7 14L5.146 8.854L0 7L5.146 5.146L7 0Z" fill="currentColor"/>
      </svg>`,
      label: "Newly available",
      year: new Date(baseline.since).getFullYear(),
    },
    limited: {
      color: "zinc",
      icon: `<svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
      </svg>`,
      label: "Limited availability",
      year: null,
    },
  };

  const badgeData = badges[baseline.level];

  return `
    <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-${badgeData.color}-500/10 text-${badgeData.color}-400 border border-${badgeData.color}-500/20">
      ${badgeData.icon}
      <span>${badgeData.label}</span>
      ${badgeData.year ? `<span class="text-${badgeData.color}-500/60">·</span><span class="text-${badgeData.color}-500/80">${badgeData.year}</span>` : ""}
    </div>
  `;
}

/**
 * Generates a status badge HTML element for a feature's CSS implementation status.
 * @param {string} status - Status value: 'native', 'partial', or 'none'
 * @returns {string} HTML string for the status badge
 */
function statusBadge(status) {
  const badges = {
    native: {
      color: "emerald",
      icon: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
      </svg>`,
      label: "Native",
    },
    partial: {
      color: "amber",
      icon: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"></path>
      </svg>`,
      label: "Partial",
    },
    none: {
      color: "rose",
      icon: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
      </svg>`,
      label: "No Equivalent",
    },
  };

  const badgeData = badges[status];

  return `
    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-${badgeData.color}-500/10 text-${badgeData.color}-300 border border-${badgeData.color}-500/20">
      ${badgeData.icon}
      ${badgeData.label}
    </span>
  `;
}

/**
 * Generates code example HTML if the feature has examples.
 * @param {CodeExample} example - Code example object with sass and css properties
 * @returns {string} HTML string for the code example section
 */
function codeExampleHtml(example) {
  if (!example) return "";

  return `
    <div class="mt-3 border-t border-zinc-800 pt-3">
      <details class="code-example-details group">
        <summary class="cursor-pointer text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors select-none">
          <span class="inline-flex items-center gap-2">
            <svg class="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
            Show Example
          </span>
        </summary>
        <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Sass</div>
            <pre class="language-scss"><code class="language-scss">${escapeHtml(example.sass)}</code></pre>
          </div>
          <div>
            <div class="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">CSS</div>
            <pre class="language-css"><code class="language-css">${escapeHtml(example.css)}</code></pre>
          </div>
        </div>
      </details>
    </div>
  `;
}

/**
 * Escapes HTML special characters.
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML string
 */
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Generates a table row HTML element for a single Sass feature.
 * @param {FeatureWithBaseline} feature - Feature data object with name, status, baseline, etc.
 * @returns {string} HTML string for the table row
 */
function generateRow(feature) {
  const { name, sassUrl, status, notes, mdn, cssFeature, caniuse, baseline, links, example } = feature;

  let notesHtml = notes;

  // Add CSS feature link if it exists
  if (cssFeature && mdn) {
    const isCode = cssFeature.includes("()") || cssFeature.includes("@");
    const linkClass = `text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 hover:decoration-blue-300/50 transition-colors${isCode ? " font-mono text-xs" : ""}`;
    const cssFeatureLink = `<a href="${mdn}" class="${linkClass}" target="_blank" rel="noopener">${cssFeature}</a>`;
    notesHtml = `${cssFeatureLink}${notes}`;
  }

  // Add caniuse link if exists
  if (caniuse && notesHtml.includes("widely supported")) {
    notesHtml = notesHtml.replace(
      "widely supported",
      `<a href="${caniuse}" class="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 hover:decoration-blue-300/50 transition-colors" target="_blank" rel="noopener">widely supported</a>`,
    );
  }

  // Handle links array
  if (links) {
    links.forEach((link) => {
      notesHtml = notesHtml.replace(
        link.text,
        `<a href="${link.url}" class="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 hover:decoration-blue-300/50 transition-colors" target="_blank" rel="noopener">${link.text}</a>`,
      );
    });
  }

  return `
    <tr class="hover:bg-zinc-800/30 transition-colors">
      <td class="px-6 py-5">
        <a href="${sassUrl}"
           class="inline-flex items-center gap-2 text-zinc-100 hover:text-white font-medium transition-colors group"
           target="_blank" rel="noopener">
          ${
            name.includes("@") || name.includes("&") || name.includes("%")
              ? name.replace(
                  /(@\w+|&|%)/,
                  '<code class="font-mono text-sm bg-zinc-800/50 px-1.5 py-0.5 rounded">$1</code>',
                )
              : name
          }
          <svg class="w-4 h-4 text-zinc-500 group-hover:text-zinc-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
          </svg>
        </a>
      </td>
      <td class="px-6 py-5">
        <div class="flex flex-col gap-2">
          ${statusBadge(status)}
          ${baseline ? baselineBadge(baseline) : ""}
        </div>
      </td>
      <td class="px-6 py-5 text-sm text-zinc-400 leading-relaxed">
        ${status !== "none" && cssFeature ? "CSS has " : ""}${notesHtml}
        ${codeExampleHtml(example)}
      </td>
    </tr>
  `;
}

/**
 * Generates the complete table HTML with all feature rows.
 * @returns {string} Complete HTML string for all table rows
 */
function generateTable() {
  const features = getAllFeaturesWithBaseline();
  const rows = features.map(generateRow).join("\n");

  return rows;
}

/**
 * Counts features by their implementation status.
 * @returns {FeatureCounts} Object with counts for native, partial, and none statuses
 */
function countFeatures() {
  const features = getAllFeaturesWithBaseline();
  const counts = {
    native: 0,
    partial: 0,
    none: 0,
  };

  features.forEach((f) => counts[f.status]++);

  return counts;
}

// Main execution
console.info("Generating table HTML...");
const tableHTML = generateTable();
const counts = countFeatures();

// Output for manual insertion or save to file
console.info("\n=== COUNTS ===");
console.info(`Native: ${counts.native}`);
console.info(`Partial: ${counts.partial}`);
console.info(`No Equivalent: ${counts.none}`);
console.info("\n=== TABLE HTML ===\n");
console.info(tableHTML);

// Optionally write to file
const outputPath = path.join(__dirname, "../generated-table.html");
fs.writeFileSync(outputPath, tableHTML);
console.info(`\n✓ Table HTML written to ${outputPath}`);
