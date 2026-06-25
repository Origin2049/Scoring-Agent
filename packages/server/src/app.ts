import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { errorHandler, notFound } from './middleware/error-handler';
import { logger } from './middleware/logger';
import { agentsRouter } from './routes/agents';
import { rubricRouter } from './routes/rubric';
import { scoringRouter } from './routes/scoring';
import { testsRouter } from './routes/tests';
import { reportsRouter } from './routes/reports';
import { statsRouter } from './routes/stats';
import { ensureDirectories } from './config';

export function createApp() {
  ensureDirectories();

  const app = new Hono();

  // Global middleware
  app.use('*', cors());
  app.use('*', logger);

  // Health check
  app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // API routes
  app.route('/api/agents', agentsRouter);
  app.route('/api/rubric', rubricRouter);
  app.route('/api/scoring', scoringRouter);
  app.route('/api/tests', testsRouter);
  app.route('/api/reports', reportsRouter);
  app.route('/api/stats', statsRouter);

  // Error handling
  app.onError(errorHandler);
  app.notFound(notFound);

  return app;
}
