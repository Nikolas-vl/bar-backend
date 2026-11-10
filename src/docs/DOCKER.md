# Docker Documentation

The day-to-day commands (start/stop, migrations, seed, ports, DB clients, AI lab) are in
the main [README](../../README.md#quick-start--local-development-infrastructure).
This file explains how the Compose setup is built.

## Files

| File                                              | Purpose                                                       |
| ------------------------------------------------- | ------------------------------------------------------------- |
| `docker-compose.yml`                              | Development stack — single source of truth for infrastructure |
| `docker-compose.prod.yml`                         | Override: compiled `prod` image, no bind-mounts               |
| `Dockerfile`                                      | Multi-stage: `dev` → `build` → `prod`                         |
| `docker/postgres/initdb/01-create-ai-database.sh` | First-run init: creates `POSTGRES_AI_DB` + `vector`           |
| `docker/postgres/initdb/sql/ai-lab-schema.sql`    | AI lab tables (`documents`, `food_documents`)                 |

## Services

| Service    | Container        | Image                    | Host port        | Internal | Volume          |
| ---------- | ---------------- | ------------------------ | ---------------- | -------- | --------------- |
| `postgres` | `jolie_postgres` | `pgvector/pgvector:pg17` | `127.0.0.1:5435` | `5432`   | `postgres_data` |
| `redis`    | `jolie_redis`    | `redis:7.2-alpine`       | `127.0.0.1:6380` | `6379`   | `redis_data`    |
| `migrate`  | `jolie_migrate`  | `jolie-backend:dev`      | —                | —        | —               |
| `backend`  | `jolie_backend`  | `jolie-backend:dev`      | `4000`           | `4000`   | bind-mounts     |

Compose project name: `bar-backend` → volumes are `bar-backend_postgres_data` and
`bar-backend_redis_data`, network `bar-backend_jolie_network`.

### Why PostgreSQL 17 + pgvector

One server serves both the application (`jolie_app`) and the AI experiments
(`jolie_ai`), so no second Postgres container is needed. Prisma 7 supports it, it is
supported upstream until 2029, and the pgvector image ships `vector` 0.8.x.
The `vector` extension is only enabled in `jolie_ai`; if the application itself ever
needs it, enable it in `jolie_app` with a Prisma migration (`CREATE EXTENSION IF NOT EXISTS vector;`).

### Startup order

1. `postgres` healthy — `pg_isready` over TCP, which only succeeds after the first-run
   init scripts have finished (the entrypoint's temporary init server is socket-only).
2. `redis` healthy — `redis-cli ping` returns `PONG`.
3. `migrate` runs `prisma migrate deploy` and must exit `0`.
4. `backend` starts (`prisma generate && npm run dev`); healthy when `/readyz` reports
   PostgreSQL and Redis `ok`.

### Connection settings inside containers

`docker-compose.yml` overrides these values from `.env` for `migrate` and `backend`:

```yaml
DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
AI_DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_AI_DB}
REDIS_HOST: redis
REDIS_PORT: 6379
OLLAMA_HOST: http://host.docker.internal:11434
```

Use a URL-safe `POSTGRES_PASSWORD` (letters, digits, `- _ . ~`), because it is inserted
into these URLs unescaped.

### Dev image and node_modules

Only `src/`, `prisma/`, `prisma.config.ts` and `tsconfig.json` are bind-mounted.
`node_modules` comes from the image (Linux build, with devDependencies), so it can't go
stale or be replaced by a Windows install. After changing dependencies run
`docker compose up -d --build`.

### Production image

`prod` contains production dependencies and `dist/` only and runs `node dist/index.js`
as the `node` user. The Prisma CLI is a devDependency, so migrations are applied by the
`migrate` service (built from the `dev` target), also when using `docker-compose.prod.yml`.

## Troubleshooting

| Symptom                                    | Cause / fix                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| `relation "food_documents" does not exist` | Script used the app DB. AI scripts must use `AI_DATABASE_URL` (`jolie_ai`). |
| Backend can't reach DB/Redis in Docker     | Something set `localhost` inside the container; compose overrides must win. |
| Local tools hit the wrong Postgres/Redis   | `localhost:5432` / `6379` are other local services. Use `5435` / `6380`.    |
| Changed `POSTGRES_*` but login fails       | Values only apply on first init: `docker compose down -v`, then `up`.       |
| `POSTGRES_PASSWORD is required`            | Set it in `.env`.                                                           |
| `migrate` exited non-zero                  | `docker compose logs migrate`                                               |
