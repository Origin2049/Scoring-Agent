// Test definition types
export type TestCategory = 'cost' | 'latency' | 'accuracy' | 'stability' | 'security';

export type TestResultStatus = 'passed' | 'failed' | 'error' | 'timeout';

export interface TestDefinition {
  id?: number;
  name: string;
  category: TestCategory;
  inputJson: string; // JSON string of test input
  expectedOutputJson?: string; // JSON string of expected output (for accuracy tests)
  timeoutMs: number;
  createdAt?: string;
}

export interface TestResult {
  id?: number;
  scoringRunId: number;
  testDefinitionId: number;
  status: TestResultStatus;
  outputJson?: string;
  errorJson?: string;
  durationMs: number;
  metricsJson?: string; // Custom per-test metrics
  createdAt?: string;
}

export interface TestMetrics {
  // Cost metrics
  tokenCount?: number;
  apiCallCount?: number;
  // Latency metrics
  timeToFirstTokenMs?: number;
  // Accuracy metrics
  exactMatch?: boolean;
  semanticSimilarity?: number;
  // Stability metrics
  successRate?: number;
  // Security metrics
  piiLeaked?: boolean;
  harmfulContent?: boolean;
  promptInjectionResisted?: boolean;
}
