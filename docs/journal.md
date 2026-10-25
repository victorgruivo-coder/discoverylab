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

Date: 2026-09-14
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

Date: 2026-10-04
Time: ~1h30m

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

## Milestone 5 — Auth backend

Date: 2026-10-04
Time: ~30m

Built:

- Signup, login, logout, /me endpoints
- Session-based auth with argon2id password hashing
- Session cookie (HttpOnly, SameSite driven by NODE_ENV)
- Login rate limiting (10/15min per IP, verified with 11th
  attempt returning 429)
- requireAuth middleware, request.user decorated
- Sliding window session refresh (<6 days remaining)
- Token model: 32 random bytes base64url in cookie, SHA-256
  hash in DB

Decisions:

- Generic 401 for login failure — no email enumeration.
  Bodies verified byte-identical with diff.
- passwordHash never returned. Grepped all responses: 0 matches.
- Rate limiter keyed on req.ip, per-route (global: false).
- trustProxy: isProduction (constructor option, not instance).
- registerAuth called directly, not via app.register(), so
  decorators are visible to sibling route plugins.
- Validation details: { path: (string | number)[], message }.
  Arrays, not dotted strings. AJV unification noted for later.
- Known v1 limitations documented in code: login timing
  side-channel, cookie Max-Age vs DB slide. Both deferred to v2.

Surprise / friction:

- Found and fixed a real bug during M5 verification: the 11th
  login returned 500 instead of 429. @fastify/rate-limit throws
  the errorResponseBuilder's return value, and the M4 error
  handler flattened non-AppError to 500. Fix: the builder now
  returns AppError('Too many requests', 'RATE_LIMITED', 429).
- Duplicate signup race: P2002 surfaced as 500. Fixed with a
  try/catch that rethrows as 409 EMAIL_TAKEN. Verified with 8
  parallel signups: 1 success, 7 conflicts, 0 errors.
- Zod v4 leaked email regex patterns in validation details.
  Mapped to { path, message } to remove the leak.
- Reasonix killed my dev server with `pkill -f "src/index.ts"`,
  matching on a command-line pattern instead of resolving the
  PID from the listening socket. Added an Infrastructure rule
  against `pkill -f`. Agent owned the mistake and corrected
  behavior in the next turn.

Next: Milestone 6 — Discoveries backend.

## Milestone 6 — Discoveries backend

Date: 2026-10-04
Time: ~30m

Built:

- POST/GET/GET:id/PATCH/DELETE on /api/v1/discoveries
- Ownership isolation via createdByUserId scoping in every query
- Soft delete via deletedAt
- Offset pagination, status filter, name search, sort

Decisions:

- Foreign rows return 404, not 403. No existence leak.
- Repo does scoped updates (WHERE id AND createdByUserId) so a
  foreign write never matches, rather than checking ownership
  before writing.
- leadName defaults from request.user.name at the service layer.
- discoveryParams Zod schema prevents non-UUID :id from reaching
  Postgres (would 500).
- PATCH endDate/startDate cross-field check lives in the service
  layer (needs persisted state, not just the patch payload).
- Validation error code unified to VALIDATION_ERROR across auth
  and discoveries. badRequest reserved for business-rule failures.

Surprise / friction:

- The shared discoveryUpdateInput .refine couldn't catch
  endDate-before-startDate when only endDate was in the payload.
  A real integrity gap that wouldn't have shown up until a user
  hit it.
- Agent flagged the .refine limitation honestly instead of
  silently shipping it.
- psql is not installed in the agent's environment; it used pg
  directly with printed SQL. Same driver, same data, but worth
  noting for future DB verification.

Next: Milestone 7 — Frameworks backend.

## Milestone 7 — Frameworks backend

Date: 2026-10-21
Time: ~30m

Built:

- GET / and GET /:key to list and read framework instances
- PUT /:key to upsert framework content (JSONB)
- 5 framework keys wired to their shared Zod schemas
- Server-side RICE score calculation via computeRiceScore
- Ownership checks reuse the discoveries service (404, never 403)

Decisions:

- Upsert pattern: PUT is idempotent. Relies on Prisma's unique
  constraint [discoveryId, frameworkKey]. No separate create/update routes.
- RICE scores are calculated on the server and saved in the JSONB
  payload. Frontend doesn't have to calculate them, and the DB is
  always correct if the formula changes.
- Missing framework returns 404 NOT_FOUND, not an empty 200. This
  distinguishes "unfilled" from "error" cleanly.
- Framework key validation (enum) happens at the Zod boundary,
  preventing bad keys from reaching the DB.

Surprise / friction:

- DeepSeek Harness (new tool) asked for danger-full-access to run
  Docker. Rejected. Reinforced the Infrastructure Rules: human runs
  Docker, agent runs curl and tests.
- Agent successfully navigated Fastify nested routes
  (/discoveries/:id/frameworks/:key) without leaks.
- Test data (Alice/Bob + discovery) left in DB intentionally for M8
  export testing.

Next: Milestone 8 — Export backend.

## Milestone 8 — Export backend

Date: 2026-10-21
Time: ~20m

Built:

- GET /discoveries/:id/export returning { markdown: string }
- Pure string-concatenation formatter (no external deps)
- Markdown generation for all 5 frameworks
- Graceful omission of empty frameworks

Decisions:

- Formatter is a pure function: takes data, returns string. No DB access,
  no HTTP context. Highly testable.
- Server-side generation ensures the output is always consistent with the
  database, regardless of what the frontend does.
- Returning JSON ({ markdown }) instead of text/markdown allows the frontend
  to render a preview modal before the user clicks "Download".
- No external Markdown parser libraries. String templates are deterministic,
  zero-dependency, and sufficient for this data shape.

Surprise / friction:

- None. The agent nailed the formatting on the first try. The M7 test data
  provided a perfect dataset for verification.

Next: Milestone 9 — Web scaffold.

## Milestone 9 — Web scaffold

Date: 2026-10-21
Time: ~1h

Built:

- Vite + React + TypeScript (strict), Tailwind v4, shadcn/ui, and
  TanStack Query in `apps/web`.
- App shell: 250px white sidebar, sticky header, slate-50 content area.
- React Router routes with Dashboard, Discoveries, Settings, and Login
  placeholders.
- Typed `api-client` with `credentials: 'include'` and parsing for the
  standard `{ error: { code, message, details } }` shape.

Decisions:

- Feature-first page folders (`features/auth`, `features/dashboard`, ...)
  match the frontend convention from `decisions.md`.
- Tailwind v4 through `@tailwindcss/vite`; theme tokens live in
  `src/index.css`, so there is no JS Tailwind config.
- Kept the shadcn CLI-generated Button and Avatar, but replaced the
  generated `cn` package with the project's clsx + tailwind-merge helper.
- Login still renders inside the shell in M9. M10 can move it to a public
  layout when auth actually exists.

Surprise / friction:

- shadcn 4.22's `radix-nova` preset installed the unified `radix-ui`
  package plus a separate `cn` package. Pruned the unused packages and
  wired `cn` manually.
- The import-x resolver needed `.tsx` in its extension list before it
  would resolve the `@/*` alias for aliased `.tsx` files.
- Headless Firefox screenshots can race Vite's CSS injection; a fresh
  profile and a second capture showed the final shell correctly.

Next: Milestone 10 — Auth UI + Dashboard.

## Milestone 10 — Auth UI + Dashboard

Date: 2026-10-21
Time: ~25m

Built:

- AuthContext with TanStack Query for /auth/me
- ProtectedRoute and PublicLayout for auth pages
- Login and Signup forms (React Hook Form + Zod)
- Dashboard fetching discoveries with TanStack Query
- DiscoveryCard grid with Empty State
- CreateDiscoveryModal with cache invalidation

Decisions:

- Use React Hook Form's Controller to isolate re-renders and fix typing lag.
- Use a custom `safeExtend` Zod schema for the modal so empty strings for
  leadName validate as undefined, allowing the backend to fall back to the
  logged-in user's name.
- Conditional rendering (`{isOpen && <Modal />}`) for the modal to physically
  unmount it from the DOM, preventing state/memory leaks.
- Removed all zoom/slide/backdrop-blur CSS animations from the Dialog to fix
  severe GPU stutter on Linux.

Surprise / friction:

- The AI agent generated a highly functional form modal that looked perfect in code,
  but had three critical real-world bugs that only surfaced during manual QA:
  1. Memory/State leak: The modal hid with CSS instead of unmounting, so the form
     remembered the previous submission.
  2. Input locking: The "Lead Name" field was pre-filled but couldn't be erased
     because React Hook Form snapped back to the default when the value was undefined.
  3. Performance lag: shadcn's default animations caused GPU stutter.
- Lesson: AI is great at wiring logic (API endpoints, DB schemas), but human QA
  is mandatory for UX. AI doesn't feel the lag or the frustration of a frozen input.

Next: Milestone 11 — Wizard workspace (Part 1).

## Milestone 11 — The Wizard Workspace & Framework Forms

Date: 2026-10-22
Time: ~Xh

Built:

- 2-column Workspace layout with fixed sidebar navigation
- Stage routing via URL search params (?stage=jtbd)
- Problem Statement, JTBD, OST, RICE, and Decision Log forms
- Dynamic lists using `useFieldArray` for multi-entry frameworks
- Live RICE score calculation in the UI
- Status dropdown and Delete confirmation in the workspace header
- Fixed auto-growing textareas for better scroll performance

Decisions:

- Changed textareas from `field-sizing-content` to fixed-height (`h-24`)
  to solve severe layout thrashing and scroll lag in React.
- URL search params (e.g., `?stage=rice`) dictate the active form, keeping
  state shareable and browser back/forward buttons functional.
- Status is manually managed via a dropdown rather than automatic progression.
  This gives the PM explicit control and avoids confusing UI jumps.
- "Dashboard" and "Discoveries" serve different jobs: Dashboard is an
  overview (stats + recent), Discoveries is the full list.

Surprise / friction:

- CORS block: The backend initially blocked PUT/DELETE requests. The agent
  caught this during testing and updated `server.ts`. Good catch, but it shows
  how frontend integration tests are mandatory.
- Form State/Memory: The "New Discovery" modal originally retained old data
  because it didn't unmount. Fixed by wrapping the modal in conditional rendering
  (`{isOpen && ...}`).
- React Hook Form: Default values for the "Lead Name" locked the input field.
  Fixed by keeping the field as a string during editing and using Zod to map
  empty strings to `undefined` only on submit.
- The AI agent writes logic quickly, but human QA remains mandatory. It didn't
  "feel" the scroll lag or the frustration of not being able to erase an input.

Next: Milestone 12 — Export UI and Deployment (Self-Hosted).
