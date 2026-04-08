# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Install all deps (including dev) — needed for TypeScript compilation
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Prune devDependencies so only production deps go into the final image
RUN npm prune --omit=dev

# ─── Stage 2: Production image ───────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

# Copy only what's needed at runtime
COPY --from=builder /app/dist          ./dist
COPY --from=builder /app/node_modules  ./node_modules
COPY --from=builder /app/package.json  ./package.json
COPY --from=builder /app/prisma        ./prisma

EXPOSE 4000

# Run migrations then start the compiled server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
