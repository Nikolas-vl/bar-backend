# Docker Documentation

This document describes how to run the Jolie Brasserie Café backend using Docker and Docker Compose.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Services](#services)
3. [Development Setup](#development-setup)
4. [Common Operations](#common-operations)
5. [Production Setup](#production-setup)
6. [Environment Variables for Compose](#environment-variables-for-compose)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Mac / Windows) or Docker Engine + Docker Compose v2 (Linux)
- A `.env` file in the project root (copy from `.env.example` and fill in values)

---

## Services

The `docker-compose.yml` defines three services:

### `postgres`

| Property     | Value                |
| ------------ | -------------------- |
| Image        | `postgres:15-alpine` |
| Container    | `jolie_postgres`     |
| Port         | `5432:5432`          |
| Data volume  | `postgres_data`      |
| Health check | `pg_isready`         |

Reads credentials from environment variables:

```yaml
POSTGRES_DB: ${POSTGRES_DB:-app}
POSTGRES_USER: ${POSTGRES_USER:-user}
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD} # required
```

### `redis`

| Property     | Value                                          |
| ------------ | ---------------------------------------------- |
| Image        | `redis:7.2-alpine`                             |
| Container    | `jolie_redis`                                  |
| Port         | `6379:6379`                                    |
| Data volume  | `redis_data`                                   |
| Persistence  | AOF (`appendonly yes`, `appendfsync everysec`) |
| Health check | `redis-cli ping`                               |

If `REDIS_PASSWORD` is set, Redis starts with `--requirepass`.

### `backend`

| Property          | Value                                         |
| ----------------- | --------------------------------------------- |
| Container         | `jolie_backend`                               |
| Port              | `${BACKEND_PORT:-4000}:${BACKEND_PORT:-4000}` |
| Depends on        | `postgres` (healthy), `redis` (healthy)       |
| Source bind-mount | `.:/app` (hot reload in dev)                  |
| Command           | `npm run dev` (ts-node-dev)                   |

---

## Development Setup

### 1. Copy and configure environment

```bash
cp .env.example .env
```

At minimum, fill in:

```dotenv
DATABASE_URL=postgresql://user:secret@postgres:5432/app
POSTGRES_PASSWORD=secret
JWT_ACCESS_SECRET=<64-byte-hex>
JWT_REFRESH_SECRET=<64-byte-hex>
CORS_ORIGIN=http://localhost:3000
REDIS_HOST=redis
REDIS_PORT=6379
FRONTEND_URL=http://localhost:3000
APP_URL=http://localhost:4000
```

> **Note:** Inside Docker Compose, use service names as hostnames: `postgres` for the database and `redis` for Redis (not `localhost`).

### 2. Start all services

```bash
docker compose up -d
```

This starts `postgres`, `redis`, and `backend` in detached mode.

### 3. Run migrations

```bash
docker compose exec backend npx prisma migrate deploy
```

### 4. Seed the database (optional)

```bash
docker compose exec backend npm run seed
```

### 5. Check logs

```bash
# All services
docker compose logs -f

# Backend only
docker compose logs -f backend

# Postgres only
docker compose logs -f postgres
```

### 6. Access the API

- API: `http://localhost:4000`
- Swagger UI: `http://localhost:4000/api-docs`
- Health check: `http://localhost:4000/healthz`
- Readiness check: `http://localhost:4000/readyz`

---

## Common Operations

### Stop containers (keep data)

```bash
docker compose down
```

### Stop containers and **delete all data** (full reset)

```bash
docker compose down -v
```

> ⚠️ This permanently deletes the `postgres_data` and `redis_data` volumes.

### Rebuild the backend image

Required after changing `package.json` or `Dockerfile`:

```bash
docker compose up -d --build backend
```

### Open a shell in the backend container

```bash
docker compose exec backend sh
```

### Open a Prisma Studio session

```bash
docker compose exec backend npx prisma studio
```

Prisma Studio runs on port `5555` — you may need to expose it in `docker-compose.yml` if you want to access it from the host.

### Connect to PostgreSQL directly

```bash
docker compose exec postgres psql -U user -d app
```

### Connect to Redis CLI

```bash
docker compose exec redis redis-cli
# If password is set:
docker compose exec redis redis-cli -a $REDIS_PASSWORD
```

---

## Production Setup

The `Dockerfile` uses a **two-stage build**:

**Stage 1 — Builder:**

- Installs all dependencies (including devDependencies for TypeScript compilation)
- Runs `npm run build` (tsc)
- Prunes devDependencies

**Stage 2 — Production image:**

- Copies only `dist/`, `node_modules/`, `package.json`, `prisma/`
- Runs `prisma migrate deploy && node dist/index.js`

### Build the production image manually

```bash
docker build -t jolie-backend:latest .
```

### Production Compose (recommended pattern)

For production, create a `docker-compose.prod.yml` override:

```yaml
# docker-compose.prod.yml
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    volumes: [] # remove bind-mount
    command: node dist/index.js
    restart: always
    environment:
      NODE_ENV: production
      LOG_PRETTY: 'false'
      LOG_LEVEL: info

  postgres:
    restart: always

  redis:
    restart: always
```

Start production stack:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Production checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set `LOG_PRETTY=false` (JSON logs for log aggregators)
- [ ] Set strong `POSTGRES_PASSWORD`
- [ ] Set `REDIS_PASSWORD`
- [ ] Use managed PostgreSQL and Redis (RDS, ElastiCache, Upstash) instead of Docker in cloud deployments
- [ ] Set `CORS_ORIGIN` to your actual frontend domain
- [ ] Configure real SMTP credentials (not Ethereal)

---

## Environment Variables for Compose

The compose file reads from the `.env` file in the project root. Variables consumed directly by Docker Compose (not passed through to the container via `env_file`):

| Variable            | Used by               | Default      |
| ------------------- | --------------------- | ------------ |
| `BACKEND_PORT`      | Port mapping          | `4000`       |
| `REDIS_PORT`        | Port mapping          | `6379`       |
| `REDIS_PASSWORD`    | Redis startup command | _(empty)_    |
| `POSTGRES_DB`       | PostgreSQL init       | `app`        |
| `POSTGRES_USER`     | PostgreSQL init       | `user`       |
| `POSTGRES_PASSWORD` | PostgreSQL init       | _(required)_ |

All other variables in `.env` are passed to the backend container via `env_file: [.env]`.

---

## Troubleshooting

### Backend fails with "Cannot connect to database"

Ensure `DATABASE_URL` uses the Docker service name `postgres`, not `localhost`:

```dotenv
DATABASE_URL=postgresql://user:secret@postgres:5432/app
#                                      ^^^^^^^^
#                                      service name, not localhost
```

### Backend fails with "Redis connection refused"

Ensure `REDIS_HOST=redis` (service name), not `localhost`:

```dotenv
REDIS_HOST=redis
```

### `POSTGRES_PASSWORD is required` error

The compose file marks `POSTGRES_PASSWORD` as required. Set it in `.env`:

```dotenv
POSTGRES_PASSWORD=your_password_here
```

### Prisma migration errors on startup

The `CMD` in Dockerfile runs `npx prisma migrate deploy` before starting the server. If there are pending migrations in `prisma/migrations/` that haven't been applied, this will run them automatically. If the migration fails (e.g. breaking schema change), the container will exit — check `docker compose logs backend`.

### Port already in use

If `5432` or `6379` are already used by local services, change the host-side port in `docker-compose.yml`:

```yaml
ports:
  - '5433:5432' # host:container
```

Then update `DATABASE_URL` to use `localhost:5433`.
