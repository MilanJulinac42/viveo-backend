# Viveo Backend

Express 5 API za Viveo platformu (Cameo-like za Srbiju). Koristi Supabase (PostgreSQL + Auth + Storage).

## Tech Stack
- Express 5.1 + TypeScript
- Supabase JS SDK v2 (supabase + supabaseAdmin klijenti u src/config/supabase.ts)
- Zod za validaciju (src/schemas/)
- Winston za logovanje, Multer za file upload, Resend za email
- Helmet + CORS + rate limiting

## Projekat struktura
- `src/app.ts` — Express app setup (CORS, helmet, body parsing, rate limiter, route mounting)
- `src/index.ts` — Server entry point (port 3001)
- `src/config/` — env.ts (Zod schema), supabase.ts, email.ts (Resend)
- `src/controllers/` — auth, categories, celebrities, orders, dashboard, reviews, applications, **admin**
- `src/routes/` — index.ts mountuje sve rute pod /api
- `src/middleware/` — auth.ts (requireAuth, requireRole), rateLimiter, upload (multer), errorHandler, httpLogger, requestId
- `src/services/` — emailService.ts (fire-and-forget email notifikacije)
- `src/utils/` — apiResponse.ts (success/error/notFound helpers), emailTemplates.ts, securityLogger.ts
- `src/types/index.ts` — AuthUser, AuthenticatedRequest, PaginationMeta, ApiResponse tipovi
- `scripts/` — test-email.ts, test-storage.ts, e2e-test.ts

## API Rute
- `POST /api/auth/register|login|logout`
- `GET /api/categories`
- `GET /api/celebrities` (sa search, filter, paginacija)
- `GET /api/celebrities/:slug` | `GET /api/celebrities/:slug/reviews`
- `POST /api/orders` | `GET /api/orders` | `GET /api/orders/:id` | `GET /api/orders/:id/video`
- `GET/PATCH /api/dashboard/requests` | `POST /api/dashboard/requests/:id/video`
- `GET/PATCH /api/dashboard/earnings|availability|profile`
- `POST /api/reviews`
- `POST /api/applications`
- `GET/PATCH/DELETE /api/admin/*` (17 endpointa, requireAuth + requireRole('admin'))

## Baza (Supabase)
Tabele: profiles, celebrities, categories, video_types, orders, reviews, availability_slots, applications
- profiles.role: 'fan' | 'star' | 'admin'
- Orders status flow: pending → approved/rejected, approved → completed (samo kad se upload-uje video)
- Supabase Storage bucket "videos" (private, max 100MB, signed URLs za pristup)

## Povezani projekti
- **viveo-client** (`../viveo-client`) — Glavni frontend (Next.js, port 3000)
- **viveo-admin** (`../viveo-admin`) — Admin panel (Next.js, port 3002)

## CORS
- `FRONTEND_URL` env podržava više origina (comma-separated): `http://localhost:3000,http://localhost:3002`
- Automatski dozvoljava `*.vercel.app` origin-e

## Git
- Grana `development` je radna grana, `main` je production
- Deploy: Railway (Dockerfile, multi-stage build, node:20-alpine)

## Važne napomene
- Express 5: CORS rejection koristi `callback(null, false)` umesto `callback(new Error())` — inače daje 500
- Email (Resend): free tier šalje samo na milanjulinac996@gmail.com dok nema verified domain
- Svi API odgovori: `{ success: true, data: T, meta?: PaginationMeta }` ili `{ success: false, error: { message, code } }`
