/**
 * @fileoverview Morgan HTTP request logger piped through Winston.
 * Logs request method, URL, status, response time, and request ID.
 */

import morgan from 'morgan';
import type { IncomingMessage } from 'node:http';
import logger from '../config/logger.js';

/** Custom Morgan token: request ID */
morgan.token('request-id', (req: IncomingMessage) => {
  return (req as IncomingMessage & { requestId?: string }).requestId || '-';
});

/** Custom Morgan format with request ID */
const FORMAT = ':request-id :method :url :status :res[content-length] - :response-time ms';

/** Morgan stream that writes to Winston */
const stream = {
  write: (message: string) => {
    const trimmed = message.trim();
    const parts = trimmed.split(' ');
    const requestId = parts[0] !== '-' ? parts[0] : undefined;
    const rest = parts.slice(1).join(' ');

    // Determine log level based on status code
    const statusMatch = trimmed.match(/\s(\d{3})\s/);
    const status = statusMatch ? parseInt(statusMatch[1], 10) : 200;

    if (status >= 500) {
      logger.error(rest, { requestId });
    } else if (status >= 400) {
      logger.warn(rest, { requestId });
    } else {
      logger.info(rest, { requestId });
    }
  },
};

/** Morgan middleware with Winston integration */
export const httpLogger = morgan(FORMAT, { stream });
