## Milestone 1 — Monorepo scaffold

Date: 2026-09-14
Time: ~2h

Built:

- pnpm workspaces with shared/api/web packages
- Strict TS base config shared across packages
- ESLint 10 flat config with type-aware linting
- Prettier with format:check gate
- Audit pass: M1 PASS WITH NOTES. No missing items. Extras
  reviewed and approved (ESLint 10 flat config, import-x,
  extra tsconfig strict flags, pnpm-workspace keys).
- Reverted .vscode/settings.json after Prettier reformatted
  it; added to .prettierignore.
- Learned: read-only audit sessions can't run bash, so
  acceptance gates must be run by hand in the VS Code terminal.

Decisions:

- Pinned TypeScript to ^5.9.3 because typescript-eslint@8
  doesn't support TS 7 yet.
- Accepted pnpm-workspace.yaml extras (allowBuilds,
  minimumReleaseAgeExclude) needed for clean install.
- Kept docs/decisions.md out of Prettier to preserve
  hand-diffable history.
- Shared package consumed from source for now; swap to dist
  when builds are added.

Surprise / friction:

- My acceptance criterion `pnpm format --check` was a no-op
  because pnpm appends args to the script, so
  `prettier --write . --check` still writes. Reasonix caught it.
  Fixed by using conventional format / format:check split.
- Reasonix truncated at 4096 output tokens mid-scaffold.
  Fixed by removing the cap in config.toml and adding
  output-discipline instructions to the prompt.

Next: Milestone 2 — Zod schemas for auth, discovery, and
the five frameworks.

## Milestone 2 — Shared Zod schemas

Date: 2026-09-14
Time: ~1h

Built:

- All domain schemas in @discoverylab/shared
- Separate Input / Output schemas per resource
- computeRiceScore pure helper, 47 runtime assertions passing

Decisions:

- Dates on the wire are ISO strings (date-only vs datetime split).
- effort must be > 0 in RICE to avoid divide-by-zero.
- Input and Output schemas are separate shapes.
- endDate >= startDate refine applied to update too (agent caught
  a spec gap; without it, PATCH could create end-before-start).
- Runtime strategy locked: tsx in dev, tsc build for prod.
  packages/shared gets a build step in M4/M5.

Surprise / friction:

- Node ESM does not map .js specifiers to .ts sources at runtime.
  tsc --noEmit passes, node --experimental-strip-types fails.
  This is why dev needs tsx and prod needs a build.

## Milestone 3 — Database

Date: 2026-09-XX
Time: ~2h

Built:

- docker-compose.yml with postgres:16-alpine, pg_isready
  healthcheck, named volume
- Prisma 7.10.0 schema: User, Session, Discovery, FrameworkInstance
- Initial migration 20260915000511_init applied to local Postgres
- Enum sync guard script (apps/api/scripts/verify-enums.mjs)
- Prisma 7 config: prisma.config.ts, no dotenv dependency
- All tables verified with \d+ in psql

Decisions:

- No Stage column in DB. Stage is derived from which framework
  instances exist, computed in the service layer.
- FrameworkInstance.content as JSONB. One row per framework per
  discovery. Relational for everything else.
- Enum type names PascalCase, values lowercase, in sync with
  packages/shared/src/enums.ts via verify:enums script.
- All id and FK columns use @db.Uuid (native Postgres uuid type)
  with Prisma-generated UUID v7 values client-side.
- Snake_case tables and columns via @@map/@map, matching the
  decisions doc rather than Prisma's PascalCase defaults.
- No redundant @@index([email]) on users — @unique covers it.

Surprise / friction:

- Prisma 7 changed a lot vs. 6: URL moved to prisma.config.ts,
  new prisma-client generator, no auto .env loading, client
  emitted to source tree. Prisma 7 was the right call
  (greenfield, current stable), but it cost an extra
  investigation pass.
- pnpm ERR_PNPM_IGNORED_BUILDS pruned zod mid-install and broke
  packages/shared typecheck with 9 TS2307 errors. Fixed by
  re-running pnpm install. Lesson: if an install ever fails on
  ignored builds, re-run install; the tree may be in a partial
  state.
- Agent environment has no Docker. Split M3 into "agent verifies
  offline" + "human runs DB steps." Worth designing acceptance
  criteria around this boundary in future milestones.

Decision (M3 pre-work):

- Prisma 7.10.0 over 6.19.3. Greenfield project, current
  stable major, Rust-free client. Migration cost is lowest now.
- Cost accepted: two new dependencies (@prisma/adapter-pg, pg)
  and a more complex setup (prisma.config.ts, generated client
  in source tree, explicit env loading).
- dotenv rejected: unnecessary dependency when Node 22's
  process.loadEnvFile() does the same job.
- Spike required before committing: confirm process.loadEnvFile()
  works inside prisma.config.ts under the Prisma CLI loader.

Decision (M3, Docker security):

- Did NOT add user to the docker group. The docker group is
  passwordless root: any member can mount the host filesystem
  via docker run. Use `sudo docker` instead, which forces a
  deliberate, authenticated action per command.
- Rootless Docker (the proper fix) deferred: adds uidmap,
  fuse-overlayfs, slirp4netns, and a per-user systemd unit.
  Worth doing later; not blocking for a single local Postgres.
- Prisma does not need Docker access — it connects to Postgres
  over TCP on localhost:5432. Only compose and exec need sudo.

Next: Milestone 4 — Fastify API foundation.

## Milestone 4 — API foundation

Date: 2026-10-XX
Time: ~Xh

Built:

- Fastify server with config, errors, logging, CORS
- Prisma client through @prisma/adapter-pg
- GET /api/v1/health reporting DB connectivity (200/503)
- setNotFoundHandler returning the contract error shape
- Graceful shutdown on SIGINT/SIGTERM
- isProduction / isDevelopment config helpers

Decisions:

- No service/repo layers yet. Only route is /health.
- Deferred shared build step to M5.
- Health returns 503 on DB down; server stays up so ops can diagnose.
- Deploy targets locked early (Vercel + Render + Neon).
- Moved generated Prisma client to src/generated/prisma so
  tsconfig rootDir: src keeps dist/index.js as the prod run line.

Surprise / friction:

- Reasonix attempted `prisma dev` as a workaround for a
  connection-refused error caused by the stopped Docker container.
  Rejected. Added "Infrastructure rules" to decisions.md.
- Reasonix sandbox cannot start/stop Docker containers (socket
  permission denied, no-new-privileges). Split verification:
  human runs docker, agent runs curl and reads output.
- Agent caught its own typecheck failure: Prisma generated client
  landed outside src, breaking rootDir. Chose to move the client
  into src rather than drop rootDir and accept dist/src/index.js.
- Agent flagged setNotFoundHandler gap honestly instead of
  silently shipping Fastify's default 404 shape.