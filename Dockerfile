# syntax=docker/dockerfile:1
#
# Targets:
#   dev   — full dependencies (ts-node-dev, prisma CLI, ts-node). Used by the Compose
#           `backend` (hot reload) and `migrate` services.
#   build — compiles TypeScript to dist/.
#   prod  — runtime-only image: production deps + dist/. `docker build .` builds this.

# Prisma CLI needs *a* DATABASE_URL to load prisma.config.ts even for `generate`,
# which never connects. The real URL is provided at runtime.
ARG PRISMA_BUILD_DATABASE_URL=postgresql://build:build@localhost:5432/build

# ─── Base: all dependencies + generated Prisma client ────────────────────────
FROM node:22-alpine AS dev
ARG PRISMA_BUILD_DATABASE_URL
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# src/generated is git-ignored, so always generate it inside the image.
RUN DATABASE_URL="$PRISMA_BUILD_DATABASE_URL" npx prisma generate

EXPOSE 4000
CMD ["npm", "run", "dev"]

# ─── Build: compile TypeScript ────────────────────────────────────────────────
FROM dev AS build
RUN npm run build && npm prune --omit=dev

# ─── Production runtime ───────────────────────────────────────────────────────
FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist         ./dist

USER node
EXPOSE 4000
# Migrations are applied by the separate `migrate` service (Prisma CLI is a dev
# dependency and is intentionally not part of this image).
CMD ["node", "dist/index.js"]
