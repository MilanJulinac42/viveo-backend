import rateLimit from 'express-rate-limit';
import logger from '../config/logger.js';

/**
 * NOTE: express-rate-limit koristi in-memory storage po defaultu.
 * Za produkciju sa više instanci, koristiti Redis store:
 *
 *   npm install rate-limit-redis ioredis
 *
 *   import RedisStore from 'rate-limit-redis';
 *   import Redis from 'ioredis';
 *   const redis = new Redis(process.env.REDIS_URL);
 *   store: new RedisStore({ sendCommand: (...args) => redis.call(...args) })
 */

// Opšti limiter za sve rute — 100 zahteva po minutu po IP
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded (general)', {
      requestId: req.requestId,
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
    });
    res.status(429).json({
      success: false,
      error: {
        message: 'Previše zahteva, pokušajte ponovo za minut',
        code: 'RATE_LIMIT_EXCEEDED',
      },
    });
  },
});

// Strožiji limiter za auth rute — 10 pokušaja po 15 minuta po IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      requestId: req.requestId,
      ip: req.ip,
      email: req.body?.email,
      userAgent: req.headers['user-agent'],
    });
    res.status(429).json({
      success: false,
      error: {
        message: 'Previše pokušaja prijave, pokušajte ponovo za 15 minuta',
        code: 'AUTH_RATE_LIMIT',
      },
    });
  },
});

// Limiter za video upload — 5 po minutu (resurski zahtevan)
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Upload rate limit exceeded', {
      requestId: req.requestId,
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
    });
    res.status(429).json({
      success: false,
      error: {
        message: 'Previše upload zahteva, pokušajte ponovo za minut',
        code: 'UPLOAD_RATE_LIMIT',
      },
    });
  },
});

// Limiter za kreiranje resursa — 20 po minutu
export const createLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Create rate limit exceeded', {
      requestId: req.requestId,
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
    });
    res.status(429).json({
      success: false,
      error: {
        message: 'Previše zahteva za kreiranje, pokušajte ponovo za minut',
        code: 'CREATE_RATE_LIMIT',
      },
    });
  },
});
