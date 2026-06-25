import { get, post, del, upload, put } from './client';
import type { AgentMetadata } from '@asp/shared';

export async function fetchAgents(params?: { page?: number; limit?: number; search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.search) searchParams.set('search', params.search);
  const qs = searchParams.toString();
  return get<{ data: AgentMetadata[]; total: number; page: number; limit: number }>(
    `/agents${qs ? `?${qs}` : ''}`,
  );
}

export async function fetchAgent(id: number) {
  return get<AgentMetadata>(`/agents/${id}`);
}

export async function deleteAgent(id: number) {
  return del<{ deleted: boolean }>(`/agents/${id}`);
}

export async function uploadAgent(formData: FormData) {
  return upload<AgentMetadata>('/agents/upload', formData);
}

export async function updateAgent(id: number, data: Partial<AgentMetadata>) {
  return put<AgentMetadata>(`/agents/${id}`, data);
}
