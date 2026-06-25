import { Hono } from 'hono';
import type { Report, ReportSummary, ScoringRun, AgentMetadata } from '@asp/shared';
import type { Grade } from '@asp/shared';
import * as db from '../db';
import { AppError } from '../middleware/error-handler';

export const reportsRouter = new Hono();

// GET /api/reports — List reports
reportsRouter.get('/', (c) => {
  const agentId = c.req.query('agentId');
  const grade = c.req.query('grade');
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '20', 10);

  let runs = db.findAll<ScoringRun>('scoring_runs').filter((r) => r.status === 'completed');

  if (agentId) {
    const aid = parseInt(agentId, 10);
    runs = runs.filter((r) => r.agentId === aid);
  }
  if (grade) {
    runs = runs.filter((r) => r.grade === grade);
  }

  runs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const total = runs.length;
  const start = (page - 1) * limit;
  const data = runs.slice(start, start + limit).map((r) => {
    const agent = db.findById<AgentMetadata>('agents', r.agentId);
    return {
      id: r.id,
      scoringRunId: r.id!,
      agentId: r.agentId,
      agentName: agent?.name || 'Unknown',
      agentVersion: agent?.version || '-',
      rubricName: 'CLASSic',
      overallScore: r.overallScore || 0,
      grade: r.grade || 'D',
      isVetoed: r.isVetoed,
      vetoReasons: r.vetoReasons,
      dimensionResults: r.dimensionResults || [],
      durationMs: r.durationMs || 0,
      createdAt: r.createdAt,
    } as Report;
  });

  return c.json({ data, total, page, limit });
});

// GET /api/reports/:id — Full report detail
reportsRouter.get('/:id', (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const run = db.findById<ScoringRun>('scoring_runs', id);

  if (!run) {
    throw new AppError(404, `Report #${id} not found`);
  }

  const agent = db.findById<AgentMetadata>('agents', run.agentId);

  const report: Report = {
    id: run.id,
    scoringRunId: run.id!,
    agentId: run.agentId,
    agentName: agent?.name || 'Unknown',
    agentVersion: agent?.version || '-',
    rubricName: 'CLASSic',
    overallScore: run.overallScore || 0,
    grade: run.grade || 'D',
    isVetoed: run.isVetoed,
    vetoReasons: run.vetoReasons,
    dimensionResults: run.dimensionResults || [],
    durationMs: run.durationMs || 0,
    createdAt: run.createdAt,
  };

  return c.json(report);
});

// GET /api/reports/:id/export — Export report as JSON
reportsRouter.get('/:id/export', (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const run = db.findById<ScoringRun>('scoring_runs', id);

  if (!run) {
    throw new AppError(404, `Report #${id} not found`);
  }

  c.header('Content-Type', 'application/json');
  c.header('Content-Disposition', `attachment; filename="agent-report-${id}.json"`);

  return c.json(run);
});

// GET /api/reports/comparison — Compare agents
reportsRouter.get('/comparison', (c) => {
  const idsParam = c.req.query('ids'); // comma-separated agent IDs
  if (!idsParam) {
    throw new AppError(400, 'Query parameter "ids" is required (comma-separated agent IDs)');
  }

  const agentIds = idsParam.split(',').map(Number).filter((n) => !isNaN(n));

  const reports: Report[] = [];

  for (const agentId of agentIds) {
    // Get latest completed scoring run for each agent
    const runs = db
      .findWhere<ScoringRun>('scoring_runs', (r) => r.agentId === agentId && r.status === 'completed')
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    if (runs.length > 0) {
      const run = runs[0];
      const agent = db.findById<AgentMetadata>('agents', agentId);
      reports.push({
        id: run.id,
        scoringRunId: run.id!,
        agentId: run.agentId,
        agentName: agent?.name || 'Unknown',
        agentVersion: agent?.version || '-',
        rubricName: 'CLASSic',
        overallScore: run.overallScore || 0,
        grade: run.grade || 'D',
        isVetoed: run.isVetoed,
        vetoReasons: run.vetoReasons,
        dimensionResults: run.dimensionResults || [],
        durationMs: run.durationMs || 0,
        createdAt: run.createdAt,
      });
    }
  }

  return c.json(reports);
});

// POST /api/reports/summary — Generate summary stats
reportsRouter.post('/summary', (c) => {
  const completedRuns = db.findWhere<ScoringRun>('scoring_runs', (r) => r.status === 'completed');
  const agents = db.findAll<AgentMetadata>('agents');

  const gradeDistribution: Record<Grade, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 };
  let totalScore = 0;
  let scoredCount = 0;

  for (const run of completedRuns) {
    if (run.grade) {
      gradeDistribution[run.grade]++;
    }
    if (run.overallScore != null) {
      totalScore += run.overallScore;
      scoredCount++;
    }
  }

  const dimensionAverages: Record<string, number> = {};
  const dimensionCounts: Record<string, number> = {};

  for (const run of completedRuns) {
    if (run.dimensionResults) {
      for (const dim of run.dimensionResults) {
        if (!dimensionAverages[dim.dimensionKey]) {
          dimensionAverages[dim.dimensionKey] = 0;
          dimensionCounts[dim.dimensionKey] = 0;
        }
        dimensionAverages[dim.dimensionKey] += dim.rawScore;
        dimensionCounts[dim.dimensionKey]++;
      }
    }
  }

  for (const key of Object.keys(dimensionAverages)) {
    dimensionAverages[key] = dimensionAverages[key] / dimensionCounts[key];
  }

  const summary: ReportSummary = {
    totalAgents: agents.length,
    totalRuns: completedRuns.length,
    avgScore: scoredCount > 0 ? totalScore / scoredCount : 0,
    gradeDistribution,
    dimensionAverages,
    recentRuns: completedRuns
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 5)
      .map((r) => {
        const agent = db.findById<AgentMetadata>('agents', r.agentId);
        return {
          id: r.id,
          scoringRunId: r.id!,
          agentId: r.agentId,
          agentName: agent?.name || 'Unknown',
          agentVersion: agent?.version || '-',
          rubricName: 'CLASSic',
          overallScore: r.overallScore || 0,
          grade: r.grade || 'D',
          isVetoed: r.isVetoed,
          vetoReasons: r.vetoReasons,
          dimensionResults: r.dimensionResults || [],
          durationMs: r.durationMs || 0,
          createdAt: r.createdAt,
        };
      }),
  };

  return c.json(summary);
});
