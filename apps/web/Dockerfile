# syntax=docker/dockerfile:1
#
# DiscoveryLab Web — production image.
#
# The build context is the repository root (see docker-compose.prod.yml) so
# this stage can read pnpm-lock.yaml, packages/shared and the root Caddyfile.

# ---------------------------------------------------------------------------
# Builder: compile @discoverylab/shared and @discoverylab/web
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder

# Keep pnpm pinned to the version the lockfile was generated with.
RUN npm install -g pnpm@12.15.0

# The workspace install includes Prisma's CLI (an API devDependency), whose
# postinstall expects these on Alpine.
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Manifests first: dependency installation is cached independently of source.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN pnpm install --frozen-lockfile

# The web package imports @discoverylab/shared from its built dist/.
COPY . .
RUN pnpm --filter @discoverylab/shared build
RUN pnpm --filter @discoverylab/web build

# ---------------------------------------------------------------------------
# Runner: Caddy serves the static build, proxies /api and terminates TLS
# ---------------------------------------------------------------------------
FROM caddy:alpine AS runner

COPY Caddyfile /etc/caddy/Caddyfile
COPY caddy-entrypoint.sh /usr/local/bin/caddy-entrypoint.sh
RUN chmod +x /usr/local/bin/caddy-entrypoint.sh
COPY --from=builder /app/apps/web/dist /usr/share/caddy

EXPOSE 80 443

ENTRYPOINT ["/usr/local/bin/caddy-entrypoint.sh"]
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
