import { get, post } from '../api/client';
import type { TestDefinition } from '@asp/shared';

export async function fetchTests(category?: string) {
  const qs = category ? `?category=${category}` : '';
  return get<TestDefinition[]>(`/tests${qs}`);
}

export async function seedTests() {
  return post<{ message: string; count: number }>('/tests/seed');
}
