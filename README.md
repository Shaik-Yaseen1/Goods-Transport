# Heavy Hulk

Heavy load transport booking platform for India — built with **Next.js 14 (App Router)**, **Tailwind CSS**, **Prisma + PostgreSQL**, **NextAuth**, **Nodemailer**, and optional **SMS OTP** (2Factor / Fast2SMS).

## Features

- Live fare estimator (base + distance × pkm × weight × 18% GST + ₹4.5/km tolls)
- Pan-India owner directory with city and truck-type filters
- Public booking flow with email confirmation
- **Admin** dashboard — manage bookings and fleet owners
- **Owner** portal — fleet owners accept or decline assigned bookings
- Optional phone OTP login for customers (SMS providers in `.env.example`)
- Booking history (local storage + API when customer auth is enabled)
- Input validation with **Zod**

## Stack

| Layer      | Technology                                      |
| ---------- | ----------------------------------------------- |
| Framework  | Next.js 14, React 18, TypeScript                |
| Styling    | Tailwind CSS (dark theme, `#F47B1A` accent)     |
| Database   | PostgreSQL + Prisma                             |
| Auth       | NextAuth v4 (admin, owner, optional customer OTP) |
| Email      | Nodemailer (SMTP)                               |
| SMS        | 2Factor.in or Fast2SMS (India)                  |

## Prerequisites

- **Node.js** 18.18+ (20 LTS recommended)
- **PostgreSQL** 14+ (local or hosted)
- **npm** (or pnpm / yarn)

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values. Required for a minimal local run:

| Variable          | Description |
| ----------------- | ----------- |
| `DATABASE_URL`    | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL`    | App URL (`http://localhost:3000` locally) |
| `ADMIN_EMAIL`     | Seeded admin email |
| `ADMIN_PASSWORD`  | Seeded admin password (hashed in DB) |
| `OWNER_PASSWORD`  | Default password for seeded fleet owners |

Optional:

| Variable | Description |
| -------- | ----------- |
| `SMTP_*` | Booking confirmation emails; without SMTP, previews log to the console |
| `TWO_FACTOR_API_KEY` or `FAST2SMS_API_KEY` | SMS OTP for customer login |

See `.env.example` for all SMS provider options and comments.

### 3. Database

```bash
# Push schema (fastest for first run)
npm run db:push

# Or versioned migrations
npm run db:migrate -- --name init

# Seed admin + sample owners
npm run db:seed
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Route | Purpose |
| ----- | ------- |
| `/` | Landing |
| `/book` | Create a booking |
| `/owners` | Browse fleet owners |
| `/history` | Booking history |
| `/admin/login` | Admin sign-in |
| `/admin` | Admin dashboard |
| `/owner/login` | Fleet owner sign-in |
| `/owner` | Owner bookings panel |

Default admin credentials come from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`. Sample owners use `OWNER_PASSWORD`.

### 5. Production build

```bash
npm run build
npm start
```

## Fare formula

```
freight = base + distanceKm × pkm × weightTons
gst     = freight × 18%
tolls   = distanceKm × 4.5
total   = freight × 1.18 + tolls
```

| Truck   | Capacity  | pkm | Base   |
| ------- | --------- | --- | ------ |
| Medium  | 1–5 t     | ₹18 | ₹2,000 |
| Heavy   | 5–15 t    | ₹28 | ₹4,500 |
| Trailer | 15–40 t   | ₹45 | ₹8,000 |

Logic lives in `src/lib/fare.ts` (client preview + server persistence).

## Project structure

```
src/
  app/              # Pages and API route handlers
  components/       # UI (booking form, admin, owner panels)
  lib/              # Prisma, auth, fare, email, SMS, validators
  middleware.ts     # Protects /admin/* and /owner/*
prisma/
  schema.prisma
  seed.ts
```

## Scripts

```bash
npm run dev          # Development server
npm run dev:clean    # Clear .next cache, then dev (fixes HMR / chunk 404s)
npm run clean        # Remove .next only
npm run build        # prisma generate + next build
npm start            # Production server
npm run db:push      # Push schema to DB
npm run db:migrate   # Create and apply migration
npm run db:seed      # Seed admin + owners
npm run db:studio    # Prisma Studio
npm run lint         # ESLint
```

## Troubleshooting

**Unstyled pages or `/_next/static` 404s** — stop the dev server and run:

```bash
npm run dev:clean
```

Often caused by a stale `.next` cache after many hot reloads or editing `.env` while `next dev` is running.

## Git

`.env` is ignored — use `.env.example` as the template. Never commit API keys or passwords.

```bash
git init
git add .
git commit -m "Initial commit"
```

## License

MIT
