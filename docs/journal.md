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
