import type { Response } from 'express';
import type { PaginationMeta } from '../types/index.js';

export function success<T>(res: Response, data: T, meta?: PaginationMeta, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data, meta });
}

export function error(res: Response, message: string, code: string, statusCode = 400) {
  return res.status(statusCode).json({ success: false, error: { message, code } });
}

export function notFound(res: Response, resource = 'Resource') {
  return error(res, `${resource} nije pronađen`, 'NOT_FOUND', 404);
}

export function unauthorized(res: Response, message = 'Niste autorizovani') {
  return error(res, message, 'UNAUTHORIZED', 401);
}

export function forbidden(res: Response, message = 'Nemate pristup') {
  return error(res, message, 'FORBIDDEN', 403);
}
