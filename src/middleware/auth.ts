import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { supabaseAdmin } from '../config/supabase.js';
import { unauthorized, forbidden } from '../utils/apiResponse.js';
import { logSecurityEvent } from '../utils/securityLogger.js';
import type { AuthenticatedRequest, AuthUser } from '../types/index.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    logSecurityEvent({
      event: 'AUTH_TOKEN_INVALID',
      ip: req.ip,
      requestId: req.requestId,
      details: 'Missing or malformed Authorization header',
      userAgent: req.headers['user-agent'],
    });
    unauthorized(res, 'Token nije prosleđen');
    return;
  }

  const token = authHeader.substring(7);

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    logSecurityEvent({
      event: 'AUTH_TOKEN_INVALID',
      ip: req.ip,
      requestId: req.requestId,
      details: error?.message || 'Invalid token',
      userAgent: req.headers['user-agent'],
    });
    unauthorized(res, 'Nevažeći token');
    return;
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  (req as AuthenticatedRequest).user = {
    id: user.id,
    email: user.email || '',
    role: (profile?.role as AuthUser['role']) || 'fan',
  };

  next();
}

export function requireRole(...roles: AuthUser['role'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      unauthorized(res);
      return;
    }

    if (!roles.includes(user.role)) {
      logSecurityEvent({
        event: 'AUTHZ_FORBIDDEN',
        ip: req.ip,
        userId: user.id,
        email: user.email,
        requestId: req.requestId,
        details: `Role "${user.role}" attempted to access route requiring [${roles.join(', ')}]`,
        userAgent: req.headers['user-agent'],
      });
      forbidden(res, 'Nemate pristup ovom resursu');
      return;
    }

    next();
  };
}
