// Agent metadata types
export interface AgentMetadata {
  id?: number;
  name: string;
  version: string;
  description?: string;
  author?: string;
  tags?: string[];
  extractedPath: string;
  entryFile: string;
  fileCount: number;
  totalSizeBytes: number;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AgentUploadInput {
  name: string;
  version?: string;
  description?: string;
  author?: string;
  tags?: string[];
  entryFile?: string;
  metadata?: Record<string, unknown>;
}
