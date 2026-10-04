# DiscoveryLab — Decisions Log

This file is the contract. Every AI coding session reads it first.
When a decision changes, update this file, not the conversation.

Last updated: 2026-10-04

---

## Product

- **Name:** DiscoveryLab
- **One-liner:** A structured workspace that guides product managers
  from problem framing to prioritized opportunities, using proven
  discovery frameworks in one place.
- **Target user v1:** Solo product manager.
- **Teams / collaboration:** Deferred to v2.
- **AI in the product:** None. The product is intentionally non-AI
  to avoid ongoing API costs. AI is used only as a coding assistant.
- **Wizard style:** Stage-based with a guided "Continue" button.
  Users can jump to any stage; nothing is blocked.
- **Stages:** Frame, Understand, Explore, Prioritize, Decide.
- **Skippable stages:** Yes, all of them. Progress shown, never enforced.
- **Frameworks in v1:**
  1. Problem Statement (Frame)
  2. Jobs To Be Done (Understand)
  3. Opportunity Solution Tree (Explore)
  4. RICE (Prioritize)
  5. Decision Log (Decide)
- **Export v1:** Markdown, generated server-side.
- **Export v2:** PDF, public share links.
- **Product name rationale:** "Lab" conveys structured experimentation,
  matches the discovery framing better than "OS" or "Hub".

## Discovery lifecycle

- **States:** draft, active, completed, archived
- **Soft delete:** Yes for discoveries (`deleted_at` timestamp).
  Hard delete for framework entries when user removes them.
- **Required to create a discovery:**
  - Discovery Name (required)
  - Discovery Lead (optional, defaults to logged-in user's name)
  - Discovery Type (optional, defaults to "feature")
  - Start Date (required)
  - End Date (optional at creation)
- **Creator vs Lead:** `created_by_user_id` is always the logged-in
  user; `lead_name` is a free-text field defaulting to that user's
  name, overridable.

## Framework data shapes

- **Problem Statement:** one per discovery.
  Fields: problem, who_is_affected, why_now, constraints, success_criteria.
- **JTBD:** many per discovery.
  Fields: job_statement, segment, notes.
- **Opportunity Solution Tree:** one tree per discovery.
  Node fields: title, type (outcome|opportunity|solution|experiment),
  parent_id, notes. One root outcome, many branches.
- **RICE:** many rows per discovery.
  Fields: opportunity_name, reach, impact (1-3), confidence (0-1),
  effort. Computed score = (R * I * C) / E.
- **Decision Log:** many entries per discovery.
  Fields: decision, rationale, decided_at, owner.

## Auth

- **Method:** email + password, session-based.
- **Password hashing:** argon2.
- **Session storage:** Postgres table `sessions` with columns
  id, user_id, token_hash, expires_at, created_at, user_agent, ip.
  Only the token *hash* is stored; the raw token lives in the cookie.
- **Cookie:** name `discoverylab_session`, flags HttpOnly,
  SameSite=Lax, Secure in production.
- **Session duration:** 7 days, sliding.
- **Email verification:** deferred to v2.
- **Forgot password:** deferred to v2.
- **Rate limiting:** 10 login attempts / 15 min per IP.
- **CORS:** allow only the web origin, credentials: true.

## Stack

### Runtime / build strategy

- Dev: `tsx` as the TypeScript loader for `apps/api` (and any
  workspace package that needs to run directly).
- Prod: `tsc` builds `apps/api` and `packages/shared` to `dist/`;
  Node runs compiled JS.
- `packages/shared` build step deferred to M12. Dev uses `tsx`,
  which resolves `.ts` sources directly. Prod build is only needed
  at deploy time. Keeping build-system work out of feature
  milestones (M5-M8) avoids mixing concerns.
- Rationale: typecheck-only isn't enough for a real server. But
  forcing a rebuild in dev kills feedback speed. Split dev/prod.

### Frontend

- React + TypeScript (strict)
- Vite
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form + Zod
- React Router

### Backend

- Node.js 22 LTS + TypeScript (strict)
- Fastify
- Zod for request/response validation
- Prisma ORM
- Pino for logging
- argon2 for password hashing
- @fastify/rate-limit for auth endpoints

### Database

- PostgreSQL
- Local dev: Docker Compose
- Prod: managed Postgres (Neon or Supabase)

### Database tooling

- Prisma 7.10.0 (current stable major).
- Datasource URL lives in `apps/api/prisma.config.ts`, not
  `schema.prisma`. Loaded via Node 22's `process.loadEnvFile()`.
- Generator: `prisma-client`, output: `apps/api/src/generated/prisma`.
  Placed under `src/` so `tsc`'s `rootDir: src` produces a clean
  `dist/index.js` and `node dist/index.js` stays the prod run line.
- Driver adapter: `@prisma/adapter-pg` + `pg`.
- `apps/api/generated/` is gitignored.
- Chosen over Prisma 6.19.3 because the project is greenfield and
  the migration cost is lowest now. Chosen over adding `dotenv`
  because Node 22 has an equivalent builtin.
- Enum values must match `packages/shared/src/enums.ts` exactly.
  `verify:enums` script enforces this.

### Deployment plan

Targets (locked early to avoid retrofit):

- **Web:** Vercel — Vite static build served from `dist/`.
- **API:** Render — Node web service running `node dist/index.js`.
- **DB:** Neon — managed Postgres 16.

Production environment variables for the API:

- `NODE_ENV=production`
- `PORT` — provided by Render.
- `DATABASE_URL` — Neon connection string. Requires
  `?sslmode=require`.
- `WEB_ORIGIN` — the Vercel URL, e.g.
  `https://discoverylab.vercel.app`.
- `LOG_LEVEL=info`

Cookie behavior (affects M5):

- Development: `SameSite=Lax`, `Secure=false` (localhost HTTP).
- Production: `SameSite=None`, `Secure=true` (cross-site API/web).
- Driven by `NODE_ENV`, not a separate env var.

Prod build:

- API: `tsc` to `dist/`, run `node dist/index.js`.
- Web: `vite build` to `dist/`, served by Vercel.
- `packages/shared`: built to `dist/` so the API can import it
  at runtime. Lands in M12.
- Migrations: `prisma migrate deploy` on Render's deploy hook.

What M4 must respect:

- Config module reads `NODE_ENV` and behaves differently per
  environment.
- CORS allows credentials and uses `WEB_ORIGIN` exactly.
- No HTTPS handling in code — Render and Vercel terminate TLS.
- No custom domain in v1. If we later move web to
  `app.discoverylab.com` and API to `api.discoverylab.com`, we
  can switch cookies back to `SameSite=Lax`. Deferred to v2.

### Shared

- `packages/shared` (`@discoverylab/shared`) — Zod schemas and
  TypeScript types used by both web and api.
- Package scope: `@discoverylab/*`
- Monorepo: pnpm workspaces (no Turborepo in v1)

## Conventions

- TypeScript strict mode everywhere. No `any`, no
  `as unknown as`.
- Zod at every boundary: API input, API output, env vars, forms.
- Backend pattern: routes → service → repo.
  - routes: HTTP only, validate with Zod, call service.
  - service: business logic, no HTTP, no SQL.
  - repo: DB access only, no business logic.
- Feature-first folders in the frontend (features/auth,
  features/discoveries, features/wizard).
- One responsibility per file. Split at ~200 lines.
- Conventional Commits: feat, fix, chore, docs, refactor, test.
- API base path: `/api/v1`.
- Standard error shape:
  `{ error: { code, message, details? } }`
- Validation error shape:
  `{ path: (string | number)[], message: string }`.
  Applies to Zod validation now. Unify the AJV branch when
  Fastify route schemas are introduced.
- Validation errors: two categories with distinct codes.
  - `VALIDATION_ERROR` (400): payload does not conform to schema.
    Shape, format, type, single-field rules. Caught by Zod at the
    route boundary or shared schema refine.
  - `BAD_REQUEST` (400): payload is well-formed but values
    conflict with persisted state. Caught in the service layer.
    Details always carry `{ field }` so clients know which input
    to highlight.
  - Example: POST with endDate < startDate → VALIDATION_ERROR
    (shared refine). PATCH with endDate < stored startDate →
    BAD_REQUEST (service-layer cross-field check).

## Infrastructure rules

- The only local database is the Docker Compose Postgres at
  `localhost:5432` (database `discoverylab`, user `discoverylab`).
- Do NOT use `prisma dev`. It creates a Prisma-managed database
  that would shadow the Docker one.
- Do NOT add a second Postgres container, service, or data dir.
- If the database is unreachable, STOP and report. Do not
  invent infrastructure to work around it. The correct fix is
  `sudo docker compose up -d`.
- Do NOT modify `docker-compose.yml` without an explicit
  decision recorded in this file.
- Do NOT use `pkill -f` or pattern-based process kills. Resolve the
  target PID with `ss -ltnp` or `lsof -i :PORT` first, then send
  the signal to that specific PID. Pattern matching has killed
  unrelated processes on this project already.

## IDs and DB conventions

- Primary keys: UUID v7 (time-sortable, no extension needed).
- `created_at` and `updated_at` on every table.
- `deleted_at` (nullable) only on `discoveries`.
- Prisma enums for: discovery_status, stage, discovery_type, node_type.
- `@db.Date` columns (startDate, endDate) are handled via
  `toIsoDate()` (`toISOString().slice(0, 10)`), which is
  timezone-independent in the API path. Raw `pg` queries may
  show a local-midnight timestamp; Prisma normalizes to UTC
  midnight. This is a driver difference, not a data problem.

## Text input rules

- Qualitative fields: auto-growing textarea, no hard character cap,
  placeholder shows an example, helper text explains what good looks like.
- Structured fields: Zod-validated, hard limits, inline errors.
- Autosave: on blur + 2s debounce + on stage change.
- v1: plain textareas only. No rich text. No markdown in inputs.
- Every empty framework shows an example entry the user can
  "use as template" or dismiss.

## Explicitly deferred (do not build in v1)

- Workspaces / teams / roles
- Real-time collaboration
- Comments and notifications
- Rich text editor
- PDF export
- Public share links
- Email verification and forgot-password
- Integrations (Jira, Slack, Linear)
- Billing, SSO, custom frameworks, version history
- Turborepo, Playwright, Sentry, Storybook
- AI features of any kind in the product

## Open questions

- None blocking. Revisit at end of v1.
