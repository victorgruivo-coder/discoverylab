# DiscoveryLab — Development Plan

12 milestones. Each is 1–2 days. Never start a milestone
before the previous one is verified and committed.

## Rules

- One milestone per Reasonix session.
- Feed `docs/decisions.md` to Reasonix at the start of every session.
- If the agent proposes work outside the milestone scope, stop it.
- Read every file the agent writes. Ask for explanations when unclear.
- Commit per milestone, not per file.
- When something breaks, fix it before moving on.

## Milestones

| #   | Milestone           | Goal                                        | Depends on | Status |
| --- | ------------------- | ------------------------------------------- | ---------- | ------ |
| 0   | Day Zero            | Repo, docs, decisions committed             | —          | ✅     |
| 1   | Monorepo scaffold   | pnpm workspaces, TS, lint, shared pkg       | 0          | ✅     |
| 2   | Shared schemas      | Zod schemas + types for everything          | 1          | ✅     |
| 3   | Database            | Prisma schema, migrations, Docker Postgres  | 2          | ✅     |
| 4   | API foundation      | Fastify, config, errors, logging, health    | 3          | ✅     |
| 5   | Auth backend        | Signup, login, logout, sessions, middleware | 4          | ✅     |
| 6   | Discoveries backend | CRUD + soft delete + lifecycle              | 5          | ⬜     |
| 7   | Frameworks backend  | 5 frameworks, entries, RICE calc            | 6          | ⬜     |
| 8   | Export backend      | Markdown generation                         | 7          | ⬜     |
| 9   | Web scaffold        | Vite, Tailwind, shadcn, router, API client  | 8          | ⬜     |
| 10  | Auth UI + Dashboard | Login, signup, list/create/delete           | 9          | ⬜     |
| 11  | Wizard workspace    | Stage nav, framework forms, autosave        | 10         | ⬜     |
| 12  | Polish + Deploy     | E2E, error states, deploy, README           | 11         | ⬜     |

## Milestone template

Each milestone has the same shape:

**A. Prompt** — self-contained, includes context, scope,
constraints, acceptance criteria, and a "do not" list.

**B. Verification** — commands run by hand to confirm
acceptance criteria.

**C. Commit** — one Conventional Commits commit per milestone.

**D. Journal entry** — 3 bullets in `docs/journal.md`:

- What I built
- One decision I made and why
- One thing that surprised me or broke
