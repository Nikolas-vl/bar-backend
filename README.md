# Jolie Brasserie Café — Backend API

Production-grade REST + WebSocket API for a full-stack restaurant management platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Quick Start — Local Development Infrastructure](#quick-start--local-development-infrastructure)
5. [Environment Variables](#environment-variables)
6. [Database](#database)
7. [Redis](#redis)
8. [WebSockets](#websockets)
9. [Authentication](#authentication)
10. [Media Handling](#media-handling)
11. [Email](#email)
12. [API Overview](#api-overview)
13. [Architecture](#architecture)
14. [Known Limitations](#known-limitations)
15. [Roadmap](#roadmap)

---

## Overview

The backend powers both:

- **Customer-facing application** — orders, cart, reservations, profile, payments
- **Admin panel** — orders management, menu CRUD, users, tables, settings, locations

Key capabilities:

- JWT authentication with refresh-token rotation
- Google OAuth 2.0 (PKCE-style state validation via Redis)
- Real-time order and reservation events via Socket.IO
- Redis caching layer for menu, settings, and locations
- Cloudinary image upload and optimisation
- Prisma ORM with PostgreSQL

---

## Tech Stack

| Layer            | Technology                               |
| ---------------- | ---------------------------------------- |
| Runtime          | Node.js 22                               |
| Framework        | Express 5                                |
| Language         | TypeScript 5                             |
| ORM              | Prisma 7 (`@prisma/adapter-pg`)          |
| Database         | PostgreSQL 17 + pgvector                 |
| Cache / Pub-Sub  | Redis 7 (ioredis)                        |
| Real-time        | Socket.IO 4 + `@socket.io/redis-adapter` |
| Validation       | Zod 4                                    |
| Auth             | JWT (`jsonwebtoken`) + bcrypt            |
| OAuth            | Google (`google-auth-library`)           |
| Logging          | Pino + pino-http                         |
| Media            | Cloudinary                               |
| Email            | Nodemailer                               |
| Security         | Helmet, CORS, express-rate-limit         |
| Money            | decimal.js                               |
| Containerisation | Docker + Docker Compose                  |

---

## Project Structure

```
src/
├── app.ts                  # Express app (middleware setup)
├── index.ts                # HTTP server bootstrap, Socket.IO init, graceful shutdown
├── routes.ts               # Top-level router
├── prisma.ts               # Prisma singleton
│
├── modules/                # Domain modules
│   ├── auth/               # Login, register, refresh, Google OAuth
│   ├── user/               # Profile, admin user management
│   ├── dish/               # Menu CRUD, ingredient relations, image upload
│   ├── ingredient/         # Ingredient CRUD
│   ├── cart/               # Cart items, extras, ingredient items
│   ├── order/              # Order creation, status, payment
│   ├── reservation/        # Reservations, pre-orders
│   ├── table/              # Table management
│   ├── location/           # Location management
│   ├── address/            # User delivery addresses
│   ├── payment/            # Payment methods
│   └── settings/           # Restaurant settings
│
├── middlewares/            # auth, validate, role, errorHandler, rateLimiter, upload
│
├── utils/                  # JWT helpers, pricing, mailer, logger, errors, cartHelpers
│
├── lib/
│   ├── cloudinary/         # Upload / delete / optimise URL helpers
│   ├── redis/              # Redis client, cache helpers, cache keys + TTL constants
│   └── socket/             # Socket.IO init, rooms, event emitters
│
├── types/                  # Backend-only type declarations
└── docs/                   # swagger.yaml + swagger.ts router
```

Each domain module follows the same pattern:

```
module/
├── *.routes.ts      # Route definitions + middleware chain
├── *.controller.ts  # HTTP request / response handling only
├── *.service.ts     # Business logic, Prisma queries
└── *.schema.ts      # Zod validation schemas + inferred types
```

---

## Quick Start — Local Development Infrastructure

Docker Compose is the single source of truth for the backend infrastructure
(PostgreSQL + Redis). **No locally installed PostgreSQL or Redis is used** — a Windows
PostgreSQL service on `5432` or a Redis service on `6379` can keep running for other
projects; this project deliberately uses different host ports.

### Required software

- Docker Desktop (Compose v2)
- Node.js 22+ and npm (only for running the backend / Prisma CLI on the host)
- Optional: [Ollama](https://ollama.com) on the host for the AI experiments (`embeddinggemma` model)

### Architecture and ports

| Service    | Image                    | From the host (`localhost`) | Inside Docker (`service:port`) | Purpose                          |
| ---------- | ------------------------ | --------------------------- | ------------------------------ | -------------------------------- |
| `postgres` | `pgvector/pgvector:pg17` | `127.0.0.1:5435`            | `postgres:5432`                | PostgreSQL 17 + pgvector         |
| `redis`    | `redis:7.2-alpine`       | `127.0.0.1:6380`            | `redis:6379`                   | Cache, OAuth state, Socket.IO    |
| `migrate`  | `jolie-backend:dev`      | —                           | —                              | One-shot `prisma migrate deploy` |
| `backend`  | `jolie-backend:dev`      | `localhost:4000`            | `backend:4000`                 | Express API (hot reload)         |

One PostgreSQL server, two databases:

| Database    | Env variable      | Used by                                             |
| ----------- | ----------------- | --------------------------------------------------- |
| `jolie_app` | `DATABASE_URL`    | The application: Prisma migrations, seed, backend   |
| `jolie_ai`  | `AI_DATABASE_URL` | AI / pgvector experiments only (`vector` extension) |

Host ports are configurable with `POSTGRES_HOST_PORT` / `REDIS_HOST_PORT` in `.env`
(keep `DATABASE_URL`, `AI_DATABASE_URL` and `REDIS_PORT` in sync if you change them).

### One `.env` for both modes

```bash
cp .env.example .env   # then set POSTGRES_PASSWORD (URL-safe) and the same value in both URLs
```

- **Locally** (`npm run dev`, Prisma CLI, scripts) the values in `.env` are used as written:
  `localhost:5435` for PostgreSQL and `localhost:6380` for Redis.
- **In Docker** `docker-compose.yml` overrides `DATABASE_URL`, `AI_DATABASE_URL`,
  `REDIS_HOST` and `REDIS_PORT` with the service names (`postgres:5432`, `redis:6379`),
  built from the `POSTGRES_*` variables. Never put `localhost` URLs into the container by hand.
- `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / `POSTGRES_AI_DB` only take effect
  when the Postgres volume is first created. After changing them, recreate it (`down -v`).

### Start / stop

```bash
docker compose up -d --build     # postgres + redis -> migrate -> backend
docker compose logs -f backend
docker compose ps                # all services should be (healthy); migrate "Exited (0)"

docker compose down              # stop, keep data
docker compose down -v           # stop and DELETE the database + redis volumes
```

Startup order is enforced with health checks: `migrate` waits until PostgreSQL accepts
TCP connections (i.e. first-run init scripts are finished), `backend` waits for a
successful `migrate` and a healthy Redis. The backend health check calls `/readyz`
(PostgreSQL + Redis).

### Initialise a fresh database

```bash
docker compose down -v           # only if you want to wipe the existing data
docker compose up -d --build     # creates jolie_app + jolie_ai, applies all migrations
npm run db:seed                  # from the host (or the Docker variant below)
```

On first start of an empty volume `docker/postgres/initdb/` creates the `jolie_ai`
database, enables `vector` in it and creates the `documents` / `food_documents` tables.
`jolie_app` is managed exclusively by Prisma migrations.

### Migrations and seed

| Task                         | From the host                             | In Docker                                                   |
| ---------------------------- | ----------------------------------------- | ----------------------------------------------------------- |
| Apply migrations             | `npm run db:migrate`                      | `docker compose run --rm migrate`                           |
| Migration status             | `npm run db:status`                       | `docker compose run --rm migrate npx prisma migrate status` |
| Seed                         | `npm run db:seed`                         | `docker compose run --rm migrate npx prisma db seed`        |
| Create a new migration (dev) | `npm run db:migrate:dev -- --name <name>` | —                                                           |
| Regenerate Prisma client     | `npm run db:generate`                     | automatic on backend start                                  |

The seed is repeatable: it deletes all application rows and re-creates them (IDs keep
increasing because sequences are not reset). Test logins: `admin@jolie.com` /
`john.doe@example.com`, password `password123`.

### Run the backend locally (outside Docker)

```bash
npm install
docker compose up -d postgres redis    # infrastructure only
npm run db:migrate && npm run db:seed  # first time
npm run dev                            # http://localhost:4000, Swagger at /api-docs
```

Stop the Docker `backend` container first (`docker compose stop backend`) or set
`BACKEND_PORT` to another port, since both use `4000`.

### Run the backend in Docker

```bash
docker compose up -d --build           # dev: bind-mounted src/, ts-node-dev hot reload
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build   # compiled prod image
```

Rebuild the image (`--build`) after changing `package.json` dependencies.

### Connect with a database client (DBeaver, pgAdmin, psql)

| Setting  | Value                                            |
| -------- | ------------------------------------------------ |
| Host     | `localhost` (or `127.0.0.1`)                     |
| Port     | `5435`                                           |
| Database | `jolie_app` (application) or `jolie_ai` (AI lab) |
| User     | `POSTGRES_USER` from `.env` (default `jolie`)    |
| Password | `POSTGRES_PASSWORD` from `.env`                  |

```bash
docker compose exec postgres psql -U jolie -d jolie_app
docker compose exec redis redis-cli
```

### AI / pgvector experiments

- AI scripts connect **only** to `AI_DATABASE_URL` (`jolie_ai`). They refuse to start
  if it is missing or equal to `DATABASE_URL` — they never fall back to the app database.
- Ollama runs on the host (`OLLAMA_HOST=http://localhost:11434`; containers use
  `host.docker.internal:11434`).
- Example: `npm run ai:embed` embeds a text with `embeddinggemma` (768 dims) and inserts
  it into `jolie_ai.food_documents`.
- Re-apply the AI schema by hand (idempotent):
  `docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_AI_DB"' < docker/postgres/initdb/sql/ai-lab-schema.sql`

---

## Environment Variables

All variables are documented in [`.env.example`](./.env.example). Keep comments on their
own lines: Docker Compose turns `KEY=   # comment` into the literal value `# comment`.

> Never commit `.env`. Use a secrets manager in production.

---

## Database

### ORM

This project uses **Prisma 7** with the `@prisma/adapter-pg` driver adapter. The schema
is `prisma/schema.prisma`; the Prisma CLI reads `DATABASE_URL` through `prisma.config.ts`
(which also defines the seed command). The generated client lives in `src/generated/prisma`
(git-ignored, created by `prisma generate`).

```bash
npx prisma studio          # visual DB browser (uses DATABASE_URL -> localhost:5435)
npx prisma migrate reset   # drop + re-migrate + seed jolie_app (dev only)
```

### Seed

`prisma/seed.ts`, run with `npm run db:seed`.

The seed creates:

- 4 users (1 admin, 3 regular)
- 2 locations (Wrocław)
- 11 tables
- 15 ingredients
- 10 dishes (4 breakfast, 6 lunch)
- Sample orders, reservations, addresses, payment methods

**Default credentials after seed:**

| Role  | Email                  | Password      |
| ----- | ---------------------- | ------------- |
| Admin | `admin@jolie.com`      | `password123` |
| User  | `john.doe@example.com` | `password123` |

---

## Redis

Redis serves two distinct purposes in this project.

### 1. Cache Layer

The cache uses a **cache-aside** pattern via the `withCache()` helper in `src/lib/redis/cache.ts`.

**Cached resources and TTL:**

| Resource              | Cache Key Pattern                 | TTL    |
| --------------------- | --------------------------------- | ------ |
| All dishes (by query) | `dishes:list:<base64-query-hash>` | 5 min  |
| Single dish           | `dishes:detail:<id>`              | 5 min  |
| All ingredients       | `ingredients:list`                | 1 hour |
| Single ingredient     | `ingredients:detail:<id>`         | 1 hour |
| All locations         | `locations:list`                  | 1 hour |
| Single location       | `locations:detail:<id>`           | 5 min  |
| Restaurant settings   | `settings:global`                 | 1 hour |

**Invalidation strategy:**

- On **create / update / delete** of any entity, the relevant cache keys are invalidated immediately using `cacheInvalidatePattern()` (SCAN + DEL) or `cacheDelete()` for single keys.
- Filtered dish queries (search, sort, category) bypass the cache to avoid stale results — only the default unfiltered list is cached.

**TTL constants** are centralised in `src/lib/redis/cache.keys.ts`:

```typescript
export const CacheTTL = {
  LONG: 3600, // 1 hour
  MEDIUM: 300, // 5 minutes
  SHORT: 60, // 1 minute
};
```

### 2. Socket.IO Pub/Sub Adapter

Socket.IO uses the `@socket.io/redis-adapter` so that WebSocket events can be broadcast across multiple backend instances (horizontal scaling).

Two Redis clients are created: `pubClient` and `subClient` — duplicates of the main client, dedicated to the adapter.

### 3. OAuth State / Code Store

Short-lived Redis keys are used in the Google OAuth flow:

| Key                  | TTL    | Purpose                                               |
| -------------------- | ------ | ----------------------------------------------------- |
| `oauth:state:<uuid>` | 10 min | CSRF protection — validates `state` param on callback |
| `oauth:code:<uuid>`  | 60 sec | One-time exchange code for frontend token handoff     |

Both keys are atomically consumed (`GETDEL`) so they can only be used once.

---

## WebSockets

See [`src/docs/WEBSOCKETS.md`](./src/docs/WEBSOCKETS.md) for the full event reference.

### Quick summary

Socket.IO is initialised in `src/lib/socket/socket.ts` and attached to the HTTP server in `src/index.ts`.

**Authentication:** Every socket connection must supply a valid JWT access token in the `auth` handshake option:

```javascript
const socket = io(API_URL, {
  auth: { token: accessToken },
});
```

Connections without a valid token are rejected immediately.

**Rooms:**

| Room            | Who joins                |
| --------------- | ------------------------ |
| `user:<userId>` | Every authenticated user |
| `room:admin`    | Users with `ADMIN` role  |

---

## Authentication

### JWT Strategy

- **Access token** — short-lived (default 15 m), sent as `Authorization: Bearer <token>` header.
- **Refresh token** — long-lived (default 7 d), stored in an **HTTP-only cookie** (`refreshToken`). The hashed version is persisted in `User.refreshToken` in the database.
- On refresh, the old token is verified, rotated (new pair issued), and the stored hash is updated.
- Deleting `User.refreshToken` (on logout or password change) immediately invalidates all active sessions.

### Google OAuth Flow

```
1. Frontend:   GET /auth/google
               → Backend redirects to Google consent screen
               → CSRF state stored in Redis (10 min)

2. Google:     Redirects to GET /auth/google/callback?code=...&state=...
               → Backend validates state from Redis (atomically consumed)
               → Exchanges code for Google ID token
               → Finds or creates User record
               → Issues JWT pair
               → Stores one-time exchange code in Redis (60 sec)
               → Redirects frontend to /auth/google/success?code=<temp>

3. Frontend:   GET /auth/google/exchange?code=<temp>
               → Backend atomically consumes exchange code from Redis
               → Returns { accessToken } + sets refresh cookie
```

This pattern avoids exposing tokens in the URL redirect.

---

## Media Handling

Dish images are uploaded to **Cloudinary**:

1. `PATCH /dishes/:id/image` — accepts `multipart/form-data` with an `image` field (JPEG / PNG / WebP, max 5 MB).
2. The image is uploaded to the `dishes/` folder in Cloudinary via `upload_stream`.
3. The `public_id` (for later deletion) and `secure_url` are stored on the `Dish` record.
4. On replacement or deletion, the old Cloudinary asset is destroyed first.

Image URLs are served through Cloudinary's CDN with automatic format and quality optimisation (`f_auto,q_auto`).

---

## Email

Emails are sent via **Nodemailer** using the SMTP credentials in `.env`.

For development, use [Ethereal](https://ethereal.email/) — a fake SMTP service that captures emails without actually delivering them.

Currently implemented email:

| Trigger                        | Template                                                                    |
| ------------------------------ | --------------------------------------------------------------------------- |
| Reservation confirmed by admin | `sendReservationConfirmation()` — date, guests, table, location, pre-orders |
| (Planned) Password reset       | `sendPasswordResetEmail()`                                                  |
| (Planned) Email verification   | `sendEmailVerification()`                                                   |

> **Note:** Emails are currently sent synchronously during the request cycle. For production, migrate to an async queue (BullMQ / RabbitMQ).

---

## API Overview

Full interactive documentation: **`GET /api-docs`** (Swagger UI).

| Domain          | Base Path       | Auth Required           |
| --------------- | --------------- | ----------------------- |
| Auth            | `/auth`         | No (except logout)      |
| Users           | `/users`        | Yes                     |
| Addresses       | `/addresses`    | Yes                     |
| Payment Methods | `/payment`      | Yes                     |
| Dishes / Menu   | `/dishes`       | Read: No / Write: Admin |
| Ingredients     | `/ingredients`  | Read: No / Write: Admin |
| Cart            | `/cart`         | Yes                     |
| Orders          | `/orders`       | Yes                     |
| Reservations    | `/reservations` | Yes                     |
| Tables          | `/tables`       | Read: No / Write: Admin |
| Locations       | `/locations`    | Read: No / Write: Admin |
| Settings        | `/settings`     | Read: No / Write: Admin |

### Request Lifecycle

```
HTTP Request
   ↓
Helmet (security headers)
   ↓
CORS
   ↓
Pino HTTP logger
   ↓
Body parser / Cookie parser
   ↓
Rate limiter (auth routes)
   ↓
Route handler
   ↓
requireAuth (if protected)
   ↓
requireRole (if admin-only)
   ↓
validate (Zod schema)
   ↓
Controller → Service → Prisma → PostgreSQL
   ↓
JSON Response
   ↓
errorHandler (catches AppError, ZodError, PrismaError)
```

### Standard Error Responses

| Status | Cause                                          |
| ------ | ---------------------------------------------- |
| `400`  | Validation error (Zod) or business logic error |
| `401`  | Missing / invalid / expired token              |
| `403`  | Insufficient role                              |
| `404`  | Resource not found                             |
| `409`  | Unique constraint violation (duplicate)        |
| `500`  | Unhandled server error                         |

---

## Architecture

### Controller-Service Pattern

- **Controller** — extracts from `req`, calls service, writes to `res`. Zero business logic.
- **Service** — all business logic, Prisma queries, transactions. No knowledge of HTTP.

### Financial Precision

All money calculations use **decimal.js** to avoid IEEE 754 floating-point errors. Prisma stores prices as `Decimal(10,2)`.

### Prisma Transactions

Used wherever atomicity is required:

- Order creation (cart → order items, clear cart)
- Payment processing
- Default card / address promotion on deletion
- User deletion (cascaded cleanup)

---

## Known Limitations

- Payments are **simulated** — no real payment gateway.
- Emails sent **synchronously** — should move to async queue for production.
- No automated tests yet.
- Rate limiting is currently commented out in `app.ts`.

---

## Roadmap

- [ ] Real payment integration (Stripe)
- [ ] Async email queue (BullMQ)
- [ ] Unit and integration test suite
- [ ] Prisma read replicas for scalability
- [ ] Prometheus metrics endpoint
- [ ] Shared Zod schema package (frontend + backend monorepo)
