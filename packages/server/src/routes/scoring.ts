import { Hono } from 'hono';
import type { ScoringRun, RubricConfig, AgentMetadata, TestDefinition, TestResult } from '@asp/shared';
import * as db from '../db';
import { AppError } from '../middleware/error-handler';
import { runScoring } from '../engine/scoring-engine';

export const scoringRouter = new Hono();

// POST /api/scoring/evaluate — Run scoring for an agent
scoringRouter.post('/evaluate', async (c) => {
  const body = await c.req.json<{ agentId: number; rubricId?: number }>();
  const { agentId, rubricId } = body;

  const agent = db.findById<AgentMetadata>('agents', agentId);
  if (!agent) {
    throw new AppError(404, `Agent #${agentId} not found`);
  }

  let rubric: RubricConfig | undefined;
  if (rubricId) {
    rubric = db.findById<RubricConfig>('rubric_configs', rubricId);
  } else {
    rubric = db.findOne<RubricConfig>('rubric_configs', (r) => r.isActive);
  }

  if (!rubric) {
    // Use default rubric
    rubric = {
      id: 0,
      name: 'CLASSic 默认评分细则',
      isActive: true,
      parsedJson: (await import('../routes/rubric')).DEFAULT_RUBRIC,
      createdAt: new Date().toISOString(),
    };
  }

  // Create scoring run record
  const run: Omit<ScoringRun, 'id'> = {
    agentId,
    rubricConfigId: rubric.id!,
    status: 'running',
    overallScore: null,
    grade: null,
    isVetoed: false,
    durationMs: null,
    createdAt: new Date().toISOString(),
    completedAt: undefined,
  };

  const savedRun = db.insert<ScoringRun>('scoring_runs', run);

  // Run scoring asynchronously
  setImmediate(async () => {
    try {
      await runScoring(savedRun, agent, rubric!);
    } catch (err) {
      console.error('Scoring run failed:', err);
      db.update<ScoringRun>('scoring_runs', savedRun.id!, {
        status: 'failed',
        errorMessage: (err as Error).message,
        completedAt: new Date().toISOString(),
      });
    }
  });

  return c.json(savedRun, 202);
});

// GET /api/scoring/runs — List scoring runs
scoringRouter.get('/runs', (c) => {
  const agentId = c.req.query('agentId');
  const status = c.req.query('status');
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '20', 10);

  let runs = db.findAll<ScoringRun>('scoring_runs');

  if (agentId) {
    const aid = parseInt(agentId, 10);
    runs = runs.filter((r) => r.agentId === aid);
  }
  if (status) {
    runs = runs.filter((r) => r.status === status);
  }

  // Sort by createdAt descending
  runs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const total = runs.length;
  const start = (page - 1) * limit;
  const data = runs.slice(start, start + limit);

  return c.json({ data, total, page, limit });
});

// GET /api/scoring/runs/:id — Get scoring run detail
scoringRouter.get('/runs/:id', (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const run = db.findById<ScoringRun>('scoring_runs', id);

  if (!run) {
    throw new AppError(404, `Scoring run #${id} not found`);
  }

  // Include test results
  const testResults = db.findWhere<TestResult>('test_results', (r) => r.scoringRunId === id);

  return c.json({ ...run, testResults });
});

// POST /api/scoring/runs/:id/retry — Retry failed run
scoringRouter.post('/runs/:id/retry', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const run = db.findById<ScoringRun>('scoring_runs', id);

  if (!run) {
    throw new AppError(404, `Scoring run #${id} not found`);
  }

  const agent = db.findById<AgentMetadata>('agents', run.agentId);
  if (!agent) {
    throw new AppError(404, `Agent #${run.agentId} not found`);
  }

  const rubric = db.findById<RubricConfig>('rubric_configs', run.rubricConfigId);
  if (!rubric) {
    throw new AppError(404, `Rubric #${run.rubricConfigId} not found`);
  }

  // Create new run
  const newRun: Omit<ScoringRun, 'id'> = {
    agentId: run.agentId,
    rubricConfigId: run.rubricConfigId,
    status: 'running',
    overallScore: null,
    grade: null,
    isVetoed: false,
    durationMs: null,
    createdAt: new Date().toISOString(),
  };

  const savedRun = db.insert<ScoringRun>('scoring_runs', newRun);

  setImmediate(async () => {
    try {
      await runScoring(savedRun, agent, rubric!);
    } catch (err) {
      console.error('Retry scoring run failed:', err);
      db.update<ScoringRun>('scoring_runs', savedRun.id!, {
        status: 'failed',
        errorMessage: (err as Error).message,
        completedAt: new Date().toISOString(),
      });
    }
  });

  return c.json(savedRun, 202);
});

// GET /api/scoring/runs/:id/results — Get full test results
scoringRouter.get('/runs/:id/results', (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const run = db.findById<ScoringRun>('scoring_runs', id);

  if (!run) {
    throw new AppError(404, `Scoring run #${id} not found`);
  }

  const testResults = db.findWhere<TestResult>('test_results', (r) => r.scoringRunId === id);

  return c.json({ run, testResults });
});
