import { Hono } from 'hono';
import type { ScoringRun, AgentMetadata } from '@asp/shared';
import type { Grade } from '@asp/shared';
import * as db from '../db';

export const statsRouter = new Hono();

// GET /api/stats/overview — Dashboard summary
statsRouter.get('/overview', (c) => {
  const agents = db.findAll<AgentMetadata>('agents');
  const completedRuns = db.findWhere<ScoringRun>('scoring_runs', (r) => r.status === 'completed');

  const gradeDistribution: Record<Grade, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 };
  let totalScore = 0;
  let scoredCount = 0;

  for (const run of completedRuns) {
    if (run.grade) gradeDistribution[run.grade]++;
    if (run.overallScore != null) {
      totalScore += run.overallScore;
      scoredCount++;
    }
  }

  return c.json({
    totalAgents: agents.length,
    totalRuns: completedRuns.length,
    avgScore: scoredCount > 0 ? totalScore / scoredCount : 0,
    gradeDistribution,
    recentRuns: completedRuns
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 5)
      .map((r) => {
        const agent = db.findById<AgentMetadata>('agents', r.agentId);
        return {
          id: r.id,
          agentId: r.agentId,
          agentName: agent?.name || 'Unknown',
          overallScore: r.overallScore,
          grade: r.grade,
          createdAt: r.createdAt,
        };
      }),
  });
});

// GET /api/stats/grade-distribution
statsRouter.get('/grade-distribution', (c) => {
  const completedRuns = db.findWhere<ScoringRun>('scoring_runs', (r) => r.status === 'completed');

  const distribution: Record<Grade, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 };
  for (const run of completedRuns) {
    if (run.grade) distribution[run.grade]++;
  }

  return c.json(distribution);
});

// GET /api/stats/dimension-averages
statsRouter.get('/dimension-averages', (c) => {
  const completedRuns = db.findWhere<ScoringRun>('scoring_runs', (r) => r.status === 'completed');

  const totals: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const run of completedRuns) {
    if (run.dimensionResults) {
      for (const dim of run.dimensionResults) {
        if (!totals[dim.dimensionKey]) {
          totals[dim.dimensionKey] = 0;
          counts[dim.dimensionKey] = 0;
        }
        totals[dim.dimensionKey] += dim.rawScore;
        counts[dim.dimensionKey]++;
      }
    }
  }

  const averages: Record<string, number> = {};
  for (const key of Object.keys(totals)) {
    averages[key] = totals[key] / counts[key];
  }

  return c.json(averages);
});
