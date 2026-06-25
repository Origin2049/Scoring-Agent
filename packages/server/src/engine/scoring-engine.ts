import type {
  ScoringRun,
  AgentMetadata,
  RubricConfig,
  TestDefinition,
  TestResult,
  DimensionResult,
  VetoResult,
  VetoReason,
} from '@asp/shared';
import { calculateGrade } from '@asp/shared';
import * as db from '../db';
import { evaluateDimension } from './dimension-evaluator';
import { checkVetoes } from './veto-checker';
import { executeTests } from './test-runner';

export async function runScoring(
  run: ScoringRun,
  agent: AgentMetadata,
  rubric: RubricConfig,
): Promise<void> {
  const startTime = Date.now();
  const parsedRubric = rubric.parsedJson;

  // 1. Get test definitions for all dimensions
  const allTests = db.findAll<TestDefinition>('test_definitions');

  // If no tests exist, seed them
  if (allTests.length === 0) {
    console.log('No test definitions found. Seeding built-in tests...');
    const { seedBuiltinTests } = await import('../routes/tests');
    // Seed is handled elsewhere; we proceed with what we have
  }

  const tests = db.findAll<TestDefinition>('test_definitions');
  console.log(`Running scoring with ${tests.length} test definitions`);

  // 2. Execute tests against the agent
  const testResults = await executeTests(agent, tests);

  // 3. Save test results to DB
  const savedResults: TestResult[] = [];
  for (const result of testResults) {
    const tr: Omit<TestResult, 'id'> = {
      scoringRunId: run.id!,
      testDefinitionId: result.testDefinitionId,
      status: result.status,
      outputJson: result.outputJson,
      errorJson: result.errorJson,
      durationMs: result.durationMs,
      metricsJson: result.metricsJson,
      createdAt: new Date().toISOString(),
    };
    const saved = db.insert<TestResult>('test_results', tr);
    savedResults.push(saved);
  }

  // 4. Check veto items FIRST
  const vetoResult = checkVetoes(parsedRubric.vetoItems, savedResults, parsedRubric.dimensions);

  if (vetoResult.triggered) {
    const durationMs = Date.now() - startTime;
    db.update<ScoringRun>('scoring_runs', run.id!, {
      status: 'completed',
      isVetoed: true,
      vetoReasons: vetoResult.reasons,
      overallScore: 0,
      grade: 'D',
      dimensionResults: [],
      durationMs,
      completedAt: new Date().toISOString(),
    });
    console.log(`Agent vetoed: ${vetoResult.reasons.map((r) => r.label).join(', ')}`);
    return;
  }

  // 5. Evaluate each dimension
  const dimensionResults: DimensionResult[] = [];

  for (const dimension of parsedRubric.dimensions) {
    // Filter test results relevant to this dimension
    const dimTestResults = savedResults.filter((tr) => {
      const testDef = tests.find((t) => t.id === tr.testDefinitionId);
      return testDef?.category === dimension.key;
    });

    const dimResult = evaluateDimension(dimension, dimTestResults, agent);
    dimensionResults.push(dimResult);
  }

  // 6. Aggregate weighted scores
  const overallScore = dimensionResults.reduce((sum, d) => sum + d.weightedScore, 0);
  const grade = calculateGrade(overallScore);
  const durationMs = Date.now() - startTime;

  // 7. Finalize scoring run
  db.update<ScoringRun>('scoring_runs', run.id!, {
    status: 'completed',
    overallScore,
    grade,
    isVetoed: false,
    dimensionResults,
    durationMs,
    completedAt: new Date().toISOString(),
  });

  console.log(
    `Scoring completed: Agent=${agent.name}, Score=${overallScore.toFixed(1)}, Grade=${grade}, Duration=${durationMs}ms`,
  );
}
