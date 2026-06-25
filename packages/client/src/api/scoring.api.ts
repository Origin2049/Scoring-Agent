import { get, post } from './client';
import type { ScoringRun } from '@asp/shared';

export async function evaluateAgent(agentId: number, rubricId?: number) {
  return post<ScoringRun>('/scoring/evaluate', { agentId, rubricId });
}

export async function fetchScoringRuns(params?: {
  agentId?: number;
  status?: string;
  page?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.agentId) searchParams.set('agentId', String(params.agentId));
  if (params?.status) searchParams.set('status', params.status);
  if (params?.page) searchParams.set('page', String(params.page));
  const qs = searchParams.toString();
  return get<{ data: ScoringRun[]; total: number }>(`/scoring/runs${qs ? `?${qs}` : ''}`);
}

export async function fetchScoringRun(id: number) {
  return get<ScoringRun & { testResults: unknown[] }>(`/scoring/runs/${id}`);
}

export async function retryScoringRun(id: number) {
  return post<ScoringRun>(`/scoring/runs/${id}/retry`);
}
