import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import apiRouter from './routes/index.js';

const app = express();

// Security headers
app.use(helmet());

// Request logging
app.use(morgan('short'));

// CORS
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));

// Body parsing sa limitom od 10KB (dovoljno za JSON, sprečava abuse)
app.use(express.json({ limit: '10kb' }));

// Globalni rate limiter (100 req/min po IP)
app.use('/api', generalLimiter);

// API routes
app.use('/api', apiRouter);

// Error handler (mora biti poslednji)
app.use(errorHandler);

export default app;
