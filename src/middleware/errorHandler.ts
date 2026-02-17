import type { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.js';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  logger.error('Unhandled error', {
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  res.status(500).json({
    success: false,
    error: {
      message: 'Interna greška servera',
      code: 'INTERNAL_ERROR',
      ...(req.requestId && { requestId: req.requestId }),
    },
  });
}
