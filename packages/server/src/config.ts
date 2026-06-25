import * as path from 'node:path';
import * as fs from 'node:fs';

const AGENT_STORAGE_DIR = path.resolve(process.cwd(), 'data', 'agent-storage');
const DATA_DIR = path.resolve(process.cwd(), 'data');

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  agentStorageDir: AGENT_STORAGE_DIR,
  dataDir: DATA_DIR,
  agentExtractDir: path.join(AGENT_STORAGE_DIR, 'extracted'),
  uploadDir: path.join(AGENT_STORAGE_DIR, 'uploads'),
};

// Ensure directories exist
export function ensureDirectories(): void {
  fs.mkdirSync(config.agentExtractDir, { recursive: true });
  fs.mkdirSync(config.uploadDir, { recursive: true });
  fs.mkdirSync(path.join(config.dataDir, 'db'), { recursive: true });
}
