/**
 * @file Migration Calculator UI module
 * Handles user interaction and results display for the Sass migration calculator
 */

import { parseSass } from './migration/parser.js';
import { detectFeatures, getFeatureSummary } from './migration/detector.js';
import {
  calculateMigrationScore,
  getRecommendationType,
  getRecommendationTitle,
  getRecommendationSummary,
  identifyBlockers,
  estimateMigrationEffort,
} from './migration/scorer.js';

/**
 * Example Sass code for demonstration
 */
const EXAMPLE_CODE = `// Design System Sass Example
@use "sass:math";

$primary-color: #3498db;
$spacing-unit: 8px;

@mixin button-variant($bg-color) {
  background: $bg-color;
  padding: $spacing-unit * 2;
  border-radius: 4px;

  &:hover {
    background: darken($bg-color, 10%);
  }
}

.button {
  @include button-variant($primary-color);

  &--secondary {
    @include button-variant(#2ecc71);
  }
}

@for $i from 1 through 4 {
  .mt-#{$i} {
    margin-top: math.div($spacing-unit * $i, 1);
  }
}`;

/**
 * Initialize the migration calculator
 */
export function initCalculator() {
  const input = document.getElementById('sass-input');
  const analyzeBtn = document.getElementById('analyze-btn');
  const clearBtn = document.getElementById('clear-btn');
  const exampleBtn = document.getElementById('example-btn');
  const resultsContainer = document.getElementById('calculator-results');

  if (!input || !analyzeBtn || !clearBtn || !exampleBtn || !resultsContainer) {
    console.warn('Calculator UI elements not found');
    return;
  }

  // Analyze button handler
  analyzeBtn.addEventListener('click', () => {
    const code = input.value.trim();

    if (!code) {
      showError('Please enter some Sass code to analyze.');
      return;
    }

    analyzeCode(code, resultsContainer);
  });

  // Clear button handler
  clearBtn.addEventListener('click', () => {
    input.value = '';
    resultsContainer.innerHTML = '';
    resultsContainer.classList.add('hidden');
  });

  // Example button handler
  exampleBtn.addEventListener('click', () => {
    input.value = EXAMPLE_CODE;
    input.focus();
  });

  // Allow Enter key with Cmd/Ctrl to trigger analysis
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      analyzeBtn.click();
    }
  });
}

/**
 * Analyze Sass code and display results
 * @param {string} code - Sass code to analyze
 * @param {HTMLElement} container - Results container element
 */
function analyzeCode(code, container) {
  // Parse the code
  const parseResult = parseSass(code);

  if (!parseResult.success) {
    showError(`Failed to parse Sass code: ${parseResult.errors[0]?.message || 'Unknown error'}`, container);
    return;
  }

  // Detect features
  const features = detectFeatures(parseResult.ast);
  const summary = getFeatureSummary(features);

  // Calculate score
  const score = calculateMigrationScore(features);
  const recommendationType = getRecommendationType(score.overall);
  const title = getRecommendationTitle(recommendationType);
  const summaryText = getRecommendationSummary(recommendationType, score);
  const blockers = identifyBlockers(features);
  const effort = estimateMigrationEffort(features, score);

  // Display results
  displayResults(container, {
    score,
    recommendationType,
    title,
    summary: summaryText,
    blockers,
    effort,
    features,
    featureSummary: summary,
  });
}

/**
 * Display analysis results
 * @param {HTMLElement} container - Results container
 * @param {object} data - Analysis data
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
function displayResults(container, data) {
  const { score, recommendationType, title, summary, blockers, effort, features, featureSummary } = data;

  // Determine recommendation color
  const colorMap = {
    migrate: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-300' },
    hybrid: { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-300' },
    'keep-sass': { border: 'border-rose-500/30', bg: 'bg-rose-500/10', text: 'text-rose-300' },
  };
  const colors = colorMap[recommendationType] || colorMap.hybrid;

  container.innerHTML = `
    <!-- Overall Score -->
    <div class="mb-6 p-6 border ${colors.border} ${colors.bg} rounded-xl">
      <div class="flex items-center justify-between flex-wrap gap-4 mb-4">
        <div>
          <h3 class="text-2xl font-bold ${colors.text} mb-1">${title}</h3>
          <p class="text-zinc-400 text-sm">Migration Difficulty Score: ${score.overall}/100</p>
        </div>
        <div class="text-right">
          <div class="text-4xl font-bold ${colors.text}">${score.overall}</div>
          <div class="text-xs text-zinc-500 uppercase tracking-wide mt-1">Score</div>
        </div>
      </div>

      <!-- Score Bar -->
      <div class="mb-4">
        <div class="h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500" style="width: ${
            score.overall
          }%"></div>
        </div>
      </div>

      <p class="text-zinc-300 leading-relaxed">${summary}</p>
    </div>

    <!-- Effort Estimate -->
    <div class="mb-6 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
      <div class="flex items-center gap-2 mb-2">
        <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h4 class="font-semibold text-zinc-200">Estimated Migration Effort</h4>
      </div>
      <p class="text-zinc-400">${effort}</p>
    </div>

    <!-- Score Breakdown -->
    <div class="mb-6">
      <h4 class="font-semibold text-zinc-200 mb-3">Score Breakdown</h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        ${renderBreakdownCard('Variables', score.breakdown.variables)}
        ${renderBreakdownCard('Nesting', score.breakdown.nesting)}
        ${renderBreakdownCard('Complexity', score.breakdown.complexity)}
        ${renderBreakdownCard('Blockers', score.breakdown.blockers)}
      </div>
    </div>

    <!-- Blockers -->
    ${
      blockers.length > 0
        ? `
      <div class="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg">
        <div class="flex items-center gap-2 mb-3">
          <svg class="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <h4 class="font-semibold text-rose-300">Migration Blockers</h4>
        </div>
        <div class="space-y-2">
          ${blockers
            .map(
              (blocker) => `
            <div class="flex items-start gap-2 text-sm">
              <span class="inline-block w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0"></span>
              <div>
                <span class="text-rose-300 font-medium">${blocker.featureType}</span>
                <span class="text-zinc-400"> (${blocker.count}×)</span>
                <span class="text-zinc-500"> - ${blocker.reason}</span>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `
        : ''
    }

    <!-- Feature Summary -->
    <div class="mb-6">
      <h4 class="font-semibold text-zinc-200 mb-3">Features Detected</h4>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        ${featureSummary.hasVariables ? renderFeatureBadge('Variables', features.variables.count) : ''}
        ${
          featureSummary.hasNesting
            ? renderFeatureBadge('Nesting', features.nesting.count, `Max depth: ${featureSummary.maxNestingDepth}`)
            : ''
        }
        ${features.mixins.count > 0 ? renderFeatureBadge('Mixins', features.mixins.count) : ''}
        ${features.functions.count > 0 ? renderFeatureBadge('Functions', features.functions.count) : ''}
        ${features.controlFlow.count > 0 ? renderFeatureBadge('Control Flow', features.controlFlow.count) : ''}
        ${features.operators.count > 0 ? renderFeatureBadge('Operators', features.operators.count) : ''}
        ${features.imports.count > 0 ? renderFeatureBadge('Imports', features.imports.count) : ''}
        ${features.extend.count > 0 ? renderFeatureBadge('Extend', features.extend.count) : ''}
        ${features.parentSelector.count > 0 ? renderFeatureBadge('Parent Selector', features.parentSelector.count) : ''}
        ${features.interpolation.count > 0 ? renderFeatureBadge('Interpolation', features.interpolation.count) : ''}
        ${features.colorFunctions.count > 0 ? renderFeatureBadge('Color Functions', features.colorFunctions.count) : ''}
        ${featureSummary.uniqueModules > 0 ? renderFeatureBadge('Built-in Modules', featureSummary.uniqueModules) : ''}
        ${features.maps.count > 0 ? renderFeatureBadge('Maps', features.maps.count) : ''}
        ${features.lists.count > 0 ? renderFeatureBadge('Lists', features.lists.count) : ''}
        ${features.placeholders.count > 0 ? renderFeatureBadge('Placeholders', features.placeholders.count) : ''}
      </div>
    </div>

    <!-- Next Steps -->
    <div class="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
      <div class="flex items-center gap-2 mb-2">
        <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
        </svg>
        <h4 class="font-semibold text-purple-300">Next Steps</h4>
      </div>
      <ul class="text-sm text-zinc-400 space-y-1 ml-7">
        ${
          recommendationType === 'migrate'
            ? `
          <li>• Review the feature comparison table below to find CSS alternatives</li>
          <li>• Start with variables - they're the easiest to migrate (use CSS custom properties)</li>
          <li>• Migrate nesting using native CSS nesting syntax</li>
          <li>• Test thoroughly after each migration step</li>
        `
            : recommendationType === 'hybrid'
            ? `
          <li>• Consider migrating simple features (variables, nesting) to native CSS</li>
          <li>• Keep complex features in Sass for now</li>
          <li>• Use @use and @forward instead of @import</li>
          <li>• Plan a gradual migration strategy</li>
        `
            : `
          <li>• Your codebase heavily relies on Sass features</li>
          <li>• Focus on using modern Sass features (@use/@forward over @import)</li>
          <li>• Consider if you really need all these features</li>
          <li>• Monitor CSS working groups for future native alternatives</li>
        `
        }
      </ul>
    </div>
  `;

  container.classList.remove('hidden');

  // Smooth scroll to results
  window.setTimeout(() => {
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

/**
 * Render a score breakdown card
 * @param {string} label - Card label
 * @param {number} score - Score value
 * @returns {string} HTML string
 */
function renderBreakdownCard(label, score) {
  let color = 'rose';
  if (score >= 80) {
    color = 'emerald';
  } else if (score >= 50) {
    color = 'amber';
  }

  return `
    <div class="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-zinc-300">${label}</span>
        <span class="text-lg font-bold text-${color}-400">${score}</span>
      </div>
      <div class="h-2 bg-zinc-700 rounded-full overflow-hidden">
        <div class="h-full bg-${color}-500" style="width: ${score}%"></div>
      </div>
    </div>
  `;
}

/**
 * Render a feature badge
 * @param {string} name - Feature name
 * @param {number} count - Feature count
 * @param {string} [detail] - Optional detail text
 * @returns {string} HTML string
 */
function renderFeatureBadge(name, count, detail = '') {
  return `
    <div class="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
      <div class="flex items-center justify-between mb-1">
        <span class="text-sm font-medium text-zinc-300">${name}</span>
        <span class="text-xs font-bold text-purple-400">${count}</span>
      </div>
      ${detail ? `<div class="text-xs text-zinc-500">${detail}</div>` : ''}
    </div>
  `;
}

/**
 * Show error message
 * @param {string} message - Error message
 * @param {HTMLElement} [container] - Results container (optional)
 */
function showError(message, container = null) {
  const errorHtml = `
    <div class="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-rose-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p class="text-rose-300 text-sm">${message}</p>
      </div>
    </div>
  `;

  if (container) {
    container.innerHTML = errorHtml;
    container.classList.remove('hidden');
  } else {
    // Show in console as fallback
    console.error(message);
  }
}
