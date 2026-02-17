import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { httpLogger } from './middleware/httpLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import apiRouter from './routes/index.js';

const app = express();

// Assign unique request ID (must be first)
app.use(requestIdMiddleware);

// Security headers
app.use(helmet());

// HTTP request logging (Winston-backed)
app.use(httpLogger);

// CORS — support multiple origins (comma-separated in env) + Vercel previews
const allowedOrigins = env.FRONTEND_URL.split(',').map((o) => o.trim());
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      // Allow exact match
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow Vercel preview deployments
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);

// Body parsing sa limitom od 10KB (dovoljno za JSON, sprečava abuse)
app.use(express.json({ limit: '10kb' }));

// Globalni rate limiter (100 req/min po IP)
app.use('/api', generalLimiter);

// API routes
app.use('/api', apiRouter);

// Error handler (mora biti poslednji)
app.use(errorHandler);

export default app;
