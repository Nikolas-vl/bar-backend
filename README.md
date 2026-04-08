# Jolie Brasserie Café — Backend API

Production-grade REST + WebSocket API for a full-stack restaurant management platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Quick Start — Local](#quick-start--local)
5. [Quick Start — Docker](#quick-start--docker)
6. [Environment Variables](#environment-variables)
7. [Database](#database)
8. [Redis](#redis)
9. [WebSockets](#websockets)
10. [Authentication](#authentication)
11. [Media Handling](#media-handling)
12. [Email](#email)
13. [API Overview](#api-overview)
14. [Architecture](#architecture)
15. [Known Limitations](#known-limitations)
16. [Roadmap](#roadmap)

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
| Database         | PostgreSQL 15                            |
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

## Quick Start — Local

### Prerequisites

- Node.js 22+
- PostgreSQL 15+
- Redis 7+

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env
# Fill in all required values (see Environment Variables section)

# 3. Run database migrations
npx prisma migrate dev

# 4. (Optional) Seed the database
npm run seed

# 5. Start in development mode (ts-node-dev with hot reload)
npm run dev
```

The API will be available at `http://localhost:4000`.
Swagger UI: `http://localhost:4000/api-docs`.

---

## Quick Start — Docker

### Prerequisites

- Docker Desktop or Docker Engine + Compose v2

### Start all services

```bash
# Copy and fill in environment variables
cp .env.example .env

# Start postgres + redis + backend
docker compose up -d

# Follow logs
docker compose logs -f backend
```

Services started:

| Service    | Port   | Description   |
| ---------- | ------ | ------------- |
| `backend`  | `4000` | Express API   |
| `postgres` | `5432` | PostgreSQL 15 |
| `redis`    | `6379` | Redis 7       |

### Run migrations inside Docker

```bash
docker compose exec backend npx prisma migrate deploy
```

### Seed the database

```bash
docker compose exec backend npm run seed
```

### Stop and remove volumes (full reset)

```bash
# Stop containers only
docker compose down

# Stop containers AND delete all data volumes
docker compose down -v
```

### Rebuild after code changes

```bash
docker compose up -d --build backend
```

> **Note:** The development compose file uses a bind-mount so source changes trigger `ts-node-dev` hot reload without rebuilding the image.

See [`src/docs/DOCKER.md`](./src/docs/DOCKER.md) for the full event reference.

---

## Environment Variables

Create a `.env` file in the project root. All variables are required unless marked optional.

```dotenv
# ── Application ──────────────────────────────────────────────────────────────
NODE_ENV=development          # development | production | test
BACKEND_PORT=4000             # Port the HTTP server listens on

# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/app

# ── JWT ───────────────────────────────────────────────────────────────────────
# Generate with:
#   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=<64-byte-hex>
JWT_ACCESS_EXPIRES=15m        # Access token lifetime (ms/s/m/h/d format)
JWT_REFRESH_SECRET=<64-byte-hex>
JWT_REFRESH_EXPIRES=7d        # Refresh token lifetime

# ── CORS ──────────────────────────────────────────────────────────────────────
# Comma-separated list of allowed origins
CORS_ORIGIN=http://localhost:3000

# ── Cloudinary (image uploads) ────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ── SMTP (email) ──────────────────────────────────────────────────────────────
SMTP_HOST=smtp.ethereal.email # Use Ethereal for development
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@jolie.com   # Optional — falls back to SMTP_USER

# ── Google OAuth ──────────────────────────────────────────────────────────────
GOOGLE_AUTH_CLIENT_ID=
GOOGLE_AUTH_CLIENT_SECRET=
FRONTEND_URL=http://localhost:3000   # Where the frontend lives (callback redirect)
APP_URL=http://localhost:4000        # Backend's own public URL (for OAuth redirect URI)

# ── Logging ───────────────────────────────────────────────────────────────────
LOG_PRETTY=true               # true = pino-pretty (dev), false = JSON (prod)
LOG_LEVEL=debug               # trace | debug | info | warn | error

# ── Redis ─────────────────────────────────────────────────────────────────────
REDIS_HOST=localhost           # Hostname of Redis server
REDIS_PORT=6379
REDIS_USERNAME=               # Optional — leave empty for default
REDIS_PASSWORD=               # Optional — leave empty if no password
REDIS_DB=0                    # Redis database index
REDIS_CACHE_TTL=300           # Default cache TTL in seconds (fallback)
REDIS_URL=                    # Optional — full URL, e.g. redis://user:pw@host:6379/0

# ── Docker Compose (PostgreSQL) ───────────────────────────────────────────────
# Only needed when running via docker-compose
POSTGRES_DB=app
POSTGRES_USER=user
POSTGRES_PASSWORD=secret
```

> **Production tip:** Never commit `.env` to version control. Use a secrets manager (AWS Secrets Manager, Doppler, etc.) in production.

---

## Database

### ORM

This project uses **Prisma 7** with the `@prisma/adapter-pg` driver adapter for direct `pg` connection pooling.

Schema location: `prisma/schema.prisma`

### Common commands

```bash
# Create and apply a new migration (dev)
npx prisma migrate dev --name <migration_name>

# Apply existing migrations (CI / production)
npx prisma migrate deploy

# Open Prisma Studio (visual DB browser)
npx prisma studio

# Regenerate the Prisma client after schema changes
npx prisma generate

# Reset database (drops all data — dev only)
npx prisma migrate reset
```

### Seed

```bash
npm run seed
# or directly:
npx ts-node prisma/seed.ts
```

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
