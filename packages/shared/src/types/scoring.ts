// Scoring types
export type Grade = 'S' | 'A' | 'B' | 'C' | 'D';

export type ScoringRunStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface SubMetricResult {
  key: string;
  label: string;
  description?: string;
  measuredValue: number;
  target: string;
  rawScore: number; // 0-100
  maxScore: number;
  passes: boolean;
}

export interface DimensionResult {
  dimensionKey: string;
  dimensionLabel: string;
  weight: number;
  rawScore: number; // 0-100
  weightedScore: number;
  grade: Grade;
  subMetrics: SubMetricResult[];
}

export interface VetoResult {
  triggered: boolean;
  reasons: VetoReason[];
}

export interface VetoReason {
  key: string;
  label: string;
  threshold: string;
  actualValue: number;
  description: string;
}

export interface ScoringRun {
  id?: number;
  agentId: number;
  rubricConfigId: number;
  status: ScoringRunStatus;
  overallScore: number | null;
  grade: Grade | null;
  isVetoed: boolean;
  vetoReasons?: VetoReason[];
  dimensionResults?: DimensionResult[];
  durationMs: number | null;
  errorMessage?: string;
  createdAt?: string;
  completedAt?: string;
}
