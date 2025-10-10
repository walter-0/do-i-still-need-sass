# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Do I Still Need Sass?" is an educational web application that helps front-end developers decide whether they still need Sass by comparing Sass features with native CSS capabilities. The site provides detailed feature comparisons, browser support data via the web-features package, and code examples.

**Tech Stack:** Vanilla JavaScript, Vite, Tailwind CSS v4, Prism.js for syntax highlighting, Vitest for testing.

## Development Commands

```bash
# Development
npm run dev                  # Start dev server (default: http://localhost:5173)

# Building
npm run build               # Production build
npm run preview             # Preview production build locally

# Code Quality
npm run lint                # Run ESLint
npm run lint:fix            # Auto-fix ESLint issues

# Testing
npm run test                # Run tests once
npm run test:watch          # Run tests in watch mode
npm run test:ui             # Open Vitest UI
npm run test:coverage       # Generate coverage report

# HTML Generation
npm run generate-table      # Regenerate features table HTML from feature-data.js
```

## Core Architecture

### Data Flow: Feature Comparison System

The application follows a **data-driven architecture** where all Sass feature information is centralized:

1. **`src/feature-data.js`** - Single source of truth
   - Exports `sassFeatures` array with all 14 Sass features
   - Each feature includes: id, name, status, notes, code examples, links
   - `getBaselineData(featureId)` - Fetches browser support from web-features package
   - `getAllFeaturesWithBaseline()` - Merges feature data with baseline browser support

2. **`scripts/generate-table.js`** - Static HTML generation
   - Reads `sassFeatures` from feature-data.js
   - Generates complete HTML table with syntax-highlighted code examples
   - Outputs to `index.html` (replaces content between `<!-- TABLE START -->` and `<!-- TABLE END -->` comments)
   - **Must be run manually** when feature data changes: `npm run generate-table`

3. **`src/main.js`** - Client-side interactivity
   - Initializes search filtering (by feature name)
   - Initializes status filtering (All, Native, Partial, No Equivalent)
   - Applies Prism.js syntax highlighting to code blocks
   - Handles expand/collapse for code examples

4. **`index.html`** - Main page
   - Contains generated table between `<!-- TABLE START -->` and `<!-- TABLE END -->` markers
   - Includes feature count badges (dynamically calculated from feature-data.js)

### Key Architectural Decisions

**Why Vanilla JS?** The project practices what it preaches - avoiding heavy dependencies when native features suffice.

**Static Generation + Client Enhancement:** HTML table is pre-generated for SEO and initial load performance, then enhanced with JS for search/filter.

**web-features Integration:** Uses the authoritative web-features npm package (maintained by browser vendors and MDN) for accurate, up-to-date baseline browser support data.

## Feature Data Structure

Each feature in `src/feature-data.js` follows this schema (see `src/types.ts`):

```typescript
interface SassFeature {
  id: string;              // kebab-case identifier
  name: string;            // Display name
  sassUrl: string;         // Link to Sass docs
  webFeatureId: string | null;  // web-features package ID (null if no CSS equivalent)
  status: 'native' | 'partial' | 'none';
  cssFeature?: string;     // Name of CSS alternative
  notes: string;           // Explanation text
  mdn?: string;            // MDN documentation link
  caniuse?: string;        // Can I Use link
  links?: Array<{text: string, url: string}>;
  example?: {
    sass: string;          // Sass code example
    css: string;           // CSS equivalent example
  };
  whatsDifferent?: string; // For 'partial' status, explain differences
}
```

## Workflow: Adding/Updating Features

1. **Edit feature data** in `src/feature-data.js`
   - Add/modify entries in the `sassFeatures` array
   - Include code examples with proper indentation
   - Add `whatsDifferent` for partial support features

2. **Regenerate HTML table**
   ```bash
   npm run generate-table
   ```
   This updates `index.html` with new content

3. **Test changes**
   - Verify search/filter still works: `npm run test`
   - Check syntax highlighting renders correctly
   - Ensure baseline badges display properly

4. **Lint and format**
   ```bash
   npm run lint:fix
   ```

## Testing Approach

Tests use Vitest with happy-dom for DOM simulation. Focus areas:

- **Search functionality:** Filtering by feature name (case-insensitive)
- **Filter functionality:** Status filters (all/native/partial/none) work independently and combined
- **Code examples:** Expand/collapse behavior, syntax highlighting applied
- **Baseline data:** Browser support data correctly fetched and displayed

When adding features, update `test/main.test.js` to include new test cases.

## Migration Calculator (Planned Feature)

The `MIGRATION_CALCULATOR.md` contains a detailed 6-phase implementation plan for an interactive Sass code analyzer. Key points:

- **Phase 2.1 (Research & Foundation)** is complete - see `SASS_MIGRATION_RESEARCH.md` for:
  - Recommended parser: PostCSS with postcss-scss plugin
  - Feature detection priority (control flow, mixins, functions are critical)
  - Scoring algorithm design (0-100 migration difficulty scale)
  - UI/UX recommendations

- **Future implementation** will parse user-provided Sass code and generate migration recommendations based on feature usage patterns

- The research document includes Mermaid diagrams for the decision framework

## Code Style & Quality

- **ESLint configuration:** `eslint.config.js` with SonarJS and JSDoc plugins
- **JSDoc comments required** for all exported functions
- **Type safety:** TypeScript definitions in `src/types.ts` (type-checking via JSDoc `@import`)
- **Vitest globals enabled:** `describe`, `it`, `expect`, `beforeEach` available without imports

## Important Files

- `src/feature-data.js` - Feature data and browser support logic (modify this, not HTML)
- `scripts/generate-table.js` - HTML generation script (run after data changes)
- `index.html` - Main page (table content auto-generated between markers)
- `SASS_MIGRATION_RESEARCH.md` - Comprehensive research findings with Mermaid diagrams
- `MIGRATION_CALCULATOR.md` - Detailed implementation plan for future calculator feature

## Gotchas

1. **Always run `npm run generate-table`** after modifying `src/feature-data.js` - changes won't appear otherwise
2. **Don't manually edit HTML** between `<!-- TABLE START -->` and `<!-- TABLE END -->` markers - it will be overwritten
3. **Tailwind classes in generated HTML** must be included in the generation script, not added manually
4. **Prism language identifiers** are `scss` and `css` - ensure code blocks use correct language
5. **web-features package** may have breaking changes - check compatibility when updating dependencies
