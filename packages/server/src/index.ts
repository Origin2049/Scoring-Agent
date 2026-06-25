import { serve } from '@hono/node-server';
import { createApp } from './app';
import { config } from './config';

const app = createApp();

serve(
  {
    fetch: app.fetch,
    port: config.port,
    hostname: config.host,
  },
  (info) => {
    console.log(`🚀 Agent Scoring Platform Server running at http://${config.host}:${info.port}`);
    console.log(`📁 Agent storage: ${config.agentStorageDir}`);
    console.log(`📊 API: http://localhost:${info.port}/api/health`);
  },
);
