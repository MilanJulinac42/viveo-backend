/**
 * @fileoverview Request ID middleware.
 * Attaches a unique ID to each request for tracing through logs.
 * Uses crypto.randomUUID() (built-in Node.js, no extra deps).
 */

import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      /** Unique request ID for log correlation */
      requestId: string;
    }
  }
}

/**
 * Assigns a unique ID to each incoming request.
 * If the client sends X-Request-ID header, it is reused; otherwise a new UUID is generated.
 * The ID is exposed back via X-Request-ID response header.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const id = (req.headers['x-request-id'] as string) || randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
}
