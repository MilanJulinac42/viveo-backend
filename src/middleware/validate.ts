import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      if (source === 'body') {
        req.body = parsed;
      } else if (source === 'query') {
        (req as unknown as Record<string, unknown>).validatedQuery = parsed;
      } else if (source === 'params') {
        (req as unknown as Record<string, unknown>).validatedParams = parsed;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        res.status(400).json({
          success: false,
          error: {
            message: messages.join(', '),
            code: 'VALIDATION_ERROR',
          },
        });
        return;
      }
      next(err);
    }
  };
}
