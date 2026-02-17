/**
 * @fileoverview Winston logger configuration.
 * Structured logging with JSON format for production, colorized for development.
 * Separate transport for error-level logs.
 */

import winston from 'winston';

const isDev = process.env.NODE_ENV !== 'production';

/** Custom format: timestamp + level + message + metadata */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  isDev
    ? winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
          const rid = requestId ? ` [${requestId}]` : '';
          const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} ${level}${rid}: ${message}${metaStr}`;
        }),
      )
    : winston.format.combine(
        winston.format.json(),
      ),
);

/** Main logger instance */
const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: logFormat,
  defaultMeta: { service: 'viveo-api' },
  transports: [
    // Console transport (always)
    new winston.transports.Console(),

    // Error log file (production)
    ...(!isDev
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],
});

export default logger;
