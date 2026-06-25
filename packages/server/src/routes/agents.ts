import { Hono } from 'hono';
import type { AgentMetadata, AgentUploadInput } from '@asp/shared';
import * as db from '../db';
import { extractZip, deleteExtracted } from '../utils/zip';
import { AppError } from '../middleware/error-handler';

export const agentsRouter = new Hono();

// POST /api/agents/upload — Upload agent zip file
agentsRouter.post('/upload', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    throw new AppError(400, 'Missing agent zip file. Use field name "file".');
  }

  if (!file.name.endsWith('.zip')) {
    throw new AppError(400, 'File must be a .zip archive');
  }

  // Parse metadata
  const metadataStr = formData.get('metadata')?.toString() || '{}';
  const metadata: AgentUploadInput = JSON.parse(metadataStr);

  const agentName = metadata.name || file.name.replace('.zip', '');
  const arrayBuffer = await file.arrayBuffer();
  const zipBuffer = Buffer.from(arrayBuffer);

  // Extract the zip
  const extractResult = extractZip(zipBuffer, agentName);

  // Create agent record
  const agent: AgentMetadata = {
    name: agentName,
    version: metadata.version || '1.0.0',
    description: metadata.description || '',
    author: metadata.author || '',
    tags: metadata.tags || [],
    extractedPath: extractResult.extractPath,
    entryFile: metadata.entryFile || extractResult.entryFile,
    fileCount: extractResult.fileCount,
    totalSizeBytes: extractResult.totalSizeBytes,
    metadata: metadata.metadata || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = db.insert<AgentMetadata>('agents', agent);

  return c.json(saved, 201);
});

// GET /api/agents — List all agents
agentsRouter.get('/', (c) => {
  const search = c.req.query('search')?.toLowerCase();
  const page = parseInt(c.req.query('page') || '1', 10);
  const limit = parseInt(c.req.query('limit') || '20', 10);

  let agents = db.findAll<AgentMetadata>('agents');

  if (search) {
    agents = agents.filter(
      (a) =>
        a.name.toLowerCase().includes(search) ||
        a.description?.toLowerCase().includes(search) ||
        a.tags?.some((t) => t.toLowerCase().includes(search)),
    );
  }

  const total = agents.length;
  const start = (page - 1) * limit;
  const data = agents.slice(start, start + limit);

  return c.json({ data, total, page, limit });
});

// GET /api/agents/:id — Get agent detail
agentsRouter.get('/:id', (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const agent = db.findById<AgentMetadata>('agents', id);

  if (!agent) {
    throw new AppError(404, `Agent #${id} not found`);
  }

  return c.json(agent);
});

// PUT /api/agents/:id — Update agent metadata
agentsRouter.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const updates = await c.req.json<Partial<AgentMetadata>>();

  // Don't allow changing extracted path or immutable fields
  delete updates.extractedPath;
  delete updates.fileCount;
  delete updates.totalSizeBytes;
  delete updates.createdAt;

  updates.updatedAt = new Date().toISOString();

  const updated = db.update<AgentMetadata>('agents', id, updates);

  if (!updated) {
    throw new AppError(404, `Agent #${id} not found`);
  }

  return c.json(updated);
});

// DELETE /api/agents/:id — Delete agent
agentsRouter.delete('/:id', (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const agent = db.findById<AgentMetadata>('agents', id);

  if (!agent) {
    throw new AppError(404, `Agent #${id} not found`);
  }

  // Delete extracted files
  deleteExtracted(agent.extractedPath);

  // Delete DB record
  db.remove('agents', id);

  return c.json({ deleted: true });
});
