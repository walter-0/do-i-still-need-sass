export interface CodeExample {
  sass: string;
  css: string;
}

export interface Link {
  text: string;
  url: string;
}

export type FeatureStatus = 'native' | 'partial' | 'none';

export type BaselineLevel = 'high' | 'low' | 'limited';

export interface BaselineData {
  level: BaselineLevel;
  available: boolean;
  since?: string;
  lowSince?: string;
  support: object;
  label?: string;
}

export interface SassFeature {
  id: string;
  name: string;
  sassUrl: string;
  webFeatureId: string | null;
  status: FeatureStatus;
  cssFeature?: string;
  notes: string;
  mdn?: string;
  caniuse?: string;
  links?: Link[];
  example?: CodeExample;
  whatsDifferent?: string;
}

export interface FeatureWithBaseline extends SassFeature {
  baseline: BaselineData | null;
}

export interface FeatureCounts {
  native: number;
  partial: number;
  none: number;
}

// ============================================
// MIGRATION CALCULATOR TYPES
// ============================================

/**
 * Source location information for detected features
 */
export interface SourceLocation {
  line: number;
  column: number;
  offset: number;
}

/**
 * Source range with start and end positions
 */
export interface SourceRange {
  start: SourceLocation;
  end: SourceLocation;
}

/**
 * A single occurrence of a detected feature
 */
export interface FeatureOccurrence {
  type: string;
  location: SourceRange;
  context?: string; // Surrounding code snippet
  value?: string; // e.g., variable name, mixin name
}

/**
 * Detection result for a specific Sass feature type
 */
export interface FeatureDetectionResult {
  count: number;
  locations: SourceLocation[];
}

/**
 * Complete detection results for all features in parsed Sass code
 */
export interface DetectionResults {
  variables: FeatureDetectionResult;
  nesting: FeatureDetectionResult & { maxDepth: number };
  mixins: FeatureDetectionResult & { definitions: number; usages: number };
  functions: FeatureDetectionResult & { definitions: number; usages: number };
  controlFlow: FeatureDetectionResult & {
    ifCount: number;
    forCount: number;
    eachCount: number;
    whileCount: number;
  };
  operators: FeatureDetectionResult;
  imports: FeatureDetectionResult;
  extend: FeatureDetectionResult;
  parentSelector: FeatureDetectionResult & { advancedUsage: number };
  interpolation: FeatureDetectionResult;
  colorFunctions: FeatureDetectionResult;
  builtInModules: FeatureDetectionResult & {
    modules: string[]; // ['sass:math', 'sass:color', etc.]
  };
  maps: FeatureDetectionResult;
  lists: FeatureDetectionResult;
  placeholders: FeatureDetectionResult;
}

/**
 * Migration difficulty level
 */
export type MigrationDifficulty = 'easy' | 'moderate' | 'difficult' | 'impossible';

/**
 * Migration recommendation type
 */
export type RecommendationType = 'migrate' | 'hybrid' | 'keep-sass';

/**
 * Specific recommendation for a single feature
 */
export interface FeatureRecommendation {
  featureType: string;
  featureName: string;
  count: number;
  difficulty: MigrationDifficulty;
  hasCSSAlternative: boolean;
  cssAlternative?: string;
  migrationSteps?: string[];
  codeExample?: {
    before: string; // Sass code
    after: string; // CSS code
  };
  considerations?: string[];
  estimatedEffort?: string; // e.g., "1-2 hours", "1 day"
}

/**
 * Overall migration score (0-100)
 * 80-100: Easy migration
 * 50-79: Moderate - hybrid approach
 * 20-49: Difficult - keep most Sass
 * 0-19: Keep Sass
 */
export interface MigrationScore {
  overall: number; // 0-100
  breakdown: {
    variables: number;
    nesting: number;
    complexity: number;
    blockers: number;
  };
}

/**
 * Blocking features that prevent full migration
 */
export interface MigrationBlocker {
  featureType: string;
  reason: string;
  count: number;
  severity: 'critical' | 'high' | 'medium';
}

/**
 * Complete analysis result from the migration calculator
 */
export interface MigrationAnalysisResult {
  // Input metadata
  codeLength: number;
  linesOfCode: number;

  // Detection results
  detectedFeatures: DetectionResults;

  // Scoring
  score: MigrationScore;

  // Overall recommendation
  recommendation: RecommendationType;
  recommendationTitle: string;
  recommendationSummary: string;

  // Blockers
  blockers: MigrationBlocker[];

  // Feature-by-feature recommendations
  featureRecommendations: FeatureRecommendation[];

  // Migration path
  quickWins: string[]; // Things that can be migrated easily
  keepSass: string[]; // Features that should stay in Sass
  estimatedEffort: string; // Overall timeline estimate

  // Benefits analysis
  benefits?: {
    removeSassDependency: boolean;
    simplifyBuild: boolean;
    improvePerformance: boolean;
    betterBrowserSupport: boolean;
  };
}

/**
 * Parser error information
 */
export interface ParserError {
  message: string;
  location?: SourceLocation;
  severity: 'error' | 'warning';
}

/**
 * Parser result with optional errors
 */
export interface ParseResult {
  success: boolean;
  ast?: any; // AST type depends on parser choice
  errors: ParserError[];
  warnings: ParserError[];
}

/**
 * Configuration options for the migration calculator
 */
export interface MigrationCalculatorConfig {
  // Browser support requirements
  minBrowserSupport?: {
    chrome?: number;
    firefox?: number;
    safari?: number;
    edge?: number;
  };

  // Feature detection options
  includeSourceLocations?: boolean;
  includeCodeContext?: boolean;

  // Scoring weights (all default to 1.0)
  weights?: {
    controlFlow?: number;
    mixins?: number;
    functions?: number;
    builtInModules?: number;
  };
}

/**
 * Report export format options
 */
export type ExportFormat = 'json' | 'markdown' | 'html' | 'pdf';

/**
 * Exportable report data
 */
export interface MigrationReport {
  generatedAt: string; // ISO timestamp
  version: string; // Calculator version
  analysis: MigrationAnalysisResult;
  format: ExportFormat;
}
