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
