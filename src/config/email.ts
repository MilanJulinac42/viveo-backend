import { Resend } from 'resend';
import { env } from './env.js';
import logger from './logger.js';

let resend: Resend | null = null;

if (env.RESEND_API_KEY) {
  resend = new Resend(env.RESEND_API_KEY);
  logger.info('Resend email client initialized');
} else {
  logger.warn('RESEND_API_KEY not set — email notifications disabled');
}

export { resend };
export const FROM_EMAIL = env.RESEND_FROM_EMAIL;
