import rateLimit from 'express-rate-limit';

// Opšti limiter za sve rute — 100 zahteva po minutu po IP
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Previše zahteva, pokušajte ponovo za minut',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
});

// Strožiji limiter za auth rute — 10 pokušaja po 15 minuta po IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Previše pokušaja prijave, pokušajte ponovo za 15 minuta',
      code: 'AUTH_RATE_LIMIT',
    },
  },
});

// Limiter za kreiranje resursa — 20 po minutu
export const createLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Previše zahteva za kreiranje, pokušajte ponovo za minut',
      code: 'CREATE_RATE_LIMIT',
    },
  },
});
