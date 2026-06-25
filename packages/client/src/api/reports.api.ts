import { get, post } from './client';
import type { Report, ReportSummary } from '@asp/shared';

export async function fetchReports(params?: {
  agentId?: number;
  grade?: string;
  page?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.agentId) searchParams.set('agentId', String(params.agentId));
  if (params?.grade) searchParams.set('grade', params.grade);
  if (params?.page) searchParams.set('page', String(params.page));
  const qs = searchParams.toString();
  return get<{ data: Report[]; total: number }>(`/reports${qs ? `?${qs}` : ''}`);
}

export async function fetchReport(id: number) {
  return get<Report>(`/reports/${id}`);
}

export async function compareAgents(ids: number[]) {
  return get<Report[]>(`/reports/comparison?ids=${ids.join(',')}`);
}

export async function fetchSummary() {
  return post<ReportSummary>('/reports/summary');
}
