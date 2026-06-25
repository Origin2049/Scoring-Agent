import { get, upload } from './client';
import type { RubricConfig, ParsedRubric } from '@asp/shared';

export async function fetchActiveRubric() {
  return get<RubricConfig & { parsedJson: ParsedRubric }>('/rubric');
}

export async function fetchParsedRubric() {
  return get<ParsedRubric>('/rubric/active/parsed');
}

export async function uploadRubric(file: File, name: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);
  return upload<RubricConfig>('/rubric/upload', formData);
}
