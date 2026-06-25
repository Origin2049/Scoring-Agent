// Rubric types
export interface RubricSubMetric {
  key: string;
  label: string;
  description?: string;
  target: string; // e.g. "> 90%", "< 5000"
  scoringFn: 'higherIsBetter' | 'lowerIsBetter' | 'boolean' | 'withinRange';
  maxScore: number; // typically 100
  thresholds?: {
    excellent?: number;
    good?: number;
    acceptable?: number;
    poor?: number;
  };
}

export interface RubricDimension {
  key: string;
  label: string;
  weight: number; // 0.0 - 1.0
  description?: string;
  subMetrics: RubricSubMetric[];
}

export interface VetoRule {
  key: string;
  label: string;
  threshold: string; // e.g. "> 5%"
  description: string;
  dimensionKey?: string;
  subMetricKey?: string;
}

export interface ParsedRubric {
  model: string;
  version: string;
  dimensions: RubricDimension[];
  vetoItems: VetoRule[];
  gradeThresholds: {
    S: number; // 90
    A: number; // 80
    B: number; // 70
    C: number; // 60
    // below C = D
  };
}

export interface RubricConfig {
  id?: number;
  name: string;
  isActive: boolean;
  sourceMarkdown?: string;
  parsedJson: ParsedRubric;
  createdAt?: string;
}
