# syntax=docker/dockerfile:1
#
# DiscoveryLab API — production image.
#
# The build context is the repository root (see docker-compose.prod.yml)
# because the API imports @discoverylab/shared from the pnpm workspace and
# the lockfile lives at the root.

# ---------------------------------------------------------------------------
# Builder: compile @discoverylab/shared and @discoverylab/api
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder

# Keep pnpm pinned to the version the lockfile was generated with.
RUN npm install -g pnpm@12.15.0

# Prisma's schema engine is a glibc binary and expects OpenSSL on Alpine.
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Manifests first: dependency installation is cached independently of source.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN pnpm install --frozen-lockfile

# The API and web packages import @discoverylab/shared from its built dist/.
# Filtered builds do not build workspace dependencies, so build shared first.
COPY . .
RUN pnpm --filter @discoverylab/shared build

# prisma generate validates the datasource config but does not connect. The
# inline URL keeps the build independent of any real database or .env file.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/discoverylab?schema=public" \
    pnpm --filter @discoverylab/api build

# ---------------------------------------------------------------------------
# Production dependencies only. Kept separate so the runner needs neither
# pnpm nor network access at build time.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS prod-deps

RUN npm install -g pnpm@12.15.0

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN pnpm install --prod --frozen-lockfile --filter @discoverylab/api...

# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner

ENV NODE_ENV=production

# argon2's musl prebuild links against libstdc++; OpenSSL is kept for Prisma
# engine fallbacks.
RUN apk add --no-cache libstdc++ openssl

WORKDIR /app

# pnpm's node_modules is a tree of relative symlinks. The workspace layout
# must therefore be reproduced exactly, including packages/shared.
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=prod-deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=prod-deps /app/packages/shared/package.json ./packages/shared/package.json

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

WORKDIR /app/apps/api

# The app only reads files; no runtime writes are needed.
USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]
