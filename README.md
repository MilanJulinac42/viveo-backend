# Viveo Backend

Backend API za Viveo platformu — personalizovane video poruke od poznatih ličnosti.

## Tech Stack

- **Node.js + Express 5** — API server
- **TypeScript** — type safety
- **Supabase** — PostgreSQL baza, autentifikacija, storage
- **Zod** — request validacija

## Setup

```bash
npm install
cp .env.example .env
# Popuni .env sa Supabase kredencijalima
npm run dev
```

Server pokreće na `http://localhost:3001`

## Environment Variables

| Varijabla | Opis |
|-----------|------|
| `PORT` | Port servera (default: 3001) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `FRONTEND_URL` | Frontend URL za CORS (default: http://localhost:3000) |

## API Endpoints

### Auth
- `POST /api/auth/register` — Registracija (fan/star)
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout (auth required)

### Categories
- `GET /api/categories` — Lista kategorija

### Celebrities
- `GET /api/celebrities` — Lista sa search, filter, sort, paginacija
- `GET /api/celebrities/:slug` — Profil zvezde
- `GET /api/celebrities/:slug/reviews` — Recenzije zvezde

### Orders (auth required)
- `POST /api/orders` — Kreiranje porudžbine
- `GET /api/orders` — Moje porudžbine
- `GET /api/orders/:id` — Detalji porudžbine

### Dashboard (star role required)
- `GET /api/dashboard/requests` — Zahtevi za zvezdu
- `PATCH /api/dashboard/requests/:id` — Update statusa
- `GET /api/dashboard/earnings` — Zarada
- `GET /api/dashboard/availability` — Dostupnost
- `PATCH /api/dashboard/availability` — Update dostupnosti
- `PATCH /api/dashboard/profile` — Update profila

### Applications
- `POST /api/applications` — Prijava za zvezdu

### Reviews (auth required)
- `POST /api/reviews` — Ostavi recenziju

## Database

SQL migracije su u `supabase/migrations/`:
- `001_initial_schema.sql` — Sve tabele, indeksi, RLS politike, trigeri
- `002_seed_categories.sql` — Seed 6 kategorija

Pokrenuti migracije u Supabase SQL editoru ili preko CLI.

## Scripts

- `npm run dev` — Development server (tsx watch)
- `npm run build` — TypeScript kompilacija
- `npm start` — Production server
