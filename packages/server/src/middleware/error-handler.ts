import type { Context } from 'hono';
import type { StatusCode } from 'hono/utils/http-status';

export class AppError extends Error {
  constructor(
    public statusCode: StatusCode,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, c: Context) {
  if (err instanceof AppError) {
    return c.json(
      {
        error: err.message,
        details: err.details,
      },
      err.statusCode,
    );
  }
  console.error('Unexpected error:', err);
  return c.json(
    {
      error: 'Internal Server Error',
      message: err.message,
    },
    500,
  );
}

export function notFound(c: Context) {
  return c.json({ error: 'Not Found' }, 404);
}
