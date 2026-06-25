import type { Grade, DimensionResult, VetoReason } from './scoring';

// Report types
export interface Report {
  id?: number;
  scoringRunId: number;
  agentId: number;
  agentName: string;
  agentVersion: string;
  rubricName: string;
  overallScore: number;
  grade: Grade;
  isVetoed: boolean;
  vetoReasons?: VetoReason[];
  dimensionResults: DimensionResult[];
  durationMs: number;
  createdAt?: string;
}

export interface ReportSummary {
  totalAgents: number;
  totalRuns: number;
  avgScore: number;
  gradeDistribution: Record<Grade, number>;
  dimensionAverages: Record<string, number>;
  recentRuns: Report[];
}
