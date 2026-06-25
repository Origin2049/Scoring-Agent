import type { Context, Next } from 'hono';

export async function logger(c: Context, next: Next) {
  const start = Date.now();
  const method = c.req.method;
  const url = c.req.url;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;
  console.log(`${method} ${url} → ${status} (${duration}ms)`);
}
