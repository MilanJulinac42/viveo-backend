/**
 * @fileoverview Security event logger.
 * Logs authentication attempts, authorization failures, and suspicious activity.
 * Separate from general logging for security audit trail.
 */

import logger from '../config/logger.js';

type SecurityEvent =
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_REGISTER'
  | 'AUTH_LOGOUT'
  | 'AUTH_TOKEN_INVALID'
  | 'AUTH_RATE_LIMIT_HIT'
  | 'AUTHZ_FORBIDDEN'
  | 'VALIDATION_FAILED'
  | 'SUSPICIOUS_ACTIVITY';

interface SecurityLogData {
  event: SecurityEvent;
  ip?: string;
  userId?: string;
  email?: string;
  requestId?: string;
  details?: string;
  userAgent?: string;
}

/**
 * Log a security-related event with structured metadata.
 * These logs can be monitored separately for intrusion detection.
 */
export function logSecurityEvent(data: SecurityLogData) {
  const level = isFailureEvent(data.event) ? 'warn' : 'info';

  logger.log(level, `[SECURITY] ${data.event}`, {
    security: true,
    event: data.event,
    ip: data.ip,
    userId: data.userId,
    email: data.email,
    requestId: data.requestId,
    details: data.details,
    userAgent: data.userAgent,
  });
}

function isFailureEvent(event: SecurityEvent): boolean {
  return [
    'AUTH_LOGIN_FAILED',
    'AUTH_TOKEN_INVALID',
    'AUTH_RATE_LIMIT_HIT',
    'AUTHZ_FORBIDDEN',
    'SUSPICIOUS_ACTIVITY',
  ].includes(event);
}
