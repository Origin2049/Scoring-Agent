import AdmZip from 'adm-zip';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { config } from '../config';
import { AppError } from '../middleware/error-handler';

export interface ExtractResult {
  extractPath: string;
  files: string[];
  entryFile: string;
  fileCount: number;
  totalSizeBytes: number;
}

export function extractZip(zipBuffer: Buffer, agentName: string): ExtractResult {
  try {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();

    if (entries.length === 0) {
      throw new AppError(400, 'Zip file is empty');
    }

    // Create a unique directory for this agent
    const safeName = agentName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueDir = `${safeName}_${Date.now()}`;
    const extractPath = path.join(config.agentExtractDir, uniqueDir);

    // Extract all files
    zip.extractAllTo(extractPath, true);

    // Collect file info
    const files: string[] = [];
    let totalSizeBytes = 0;

    function collectFiles(dir: string, basePath: string = '') {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = basePath ? `${basePath}/${item}` : item;
        if (fs.statSync(fullPath).isDirectory()) {
          collectFiles(fullPath, relativePath);
        } else {
          files.push(relativePath);
          totalSizeBytes += fs.statSync(fullPath).size;
        }
      }
    }

    collectFiles(extractPath);

    // Detect entry file
    const entryFile = detectEntryFile(files);

    return {
      extractPath,
      files,
      entryFile,
      fileCount: files.length,
      totalSizeBytes,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(400, `Failed to extract zip: ${(err as Error).message}`);
  }
}

function detectEntryFile(files: string[]): string {
  // Priority: index.js, index.mjs, main.js, app.js, server.js, or the first .js file
  const priorities = [
    'index.js', 'index.mjs', 'main.js', 'main.mjs',
    'app.js', 'app.mjs', 'server.js', 'server.mjs',
    'agent.js', 'agent.mjs', 'handler.js', 'handler.mjs',
  ];

  for (const priority of priorities) {
    const found = files.find((f) => f.endsWith(priority));
    if (found) return found;
  }

  // Return the first .js/.mjs file at root or near-root level
  const jsFile = files.find((f) => /\.(m?js|ts|mts)$/.test(f));
  if (jsFile) return jsFile;

  // Fallback
  return files[0] || 'index.js';
}

export function deleteExtracted(path: string): void {
  if (fs.existsSync(path)) {
    fs.rmSync(path, { recursive: true, force: true });
  }
}
