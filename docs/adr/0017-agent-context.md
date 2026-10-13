# ADR-0017: Context strategy for AI coding agents

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** Mentora team
- **Tags:** process
- **Supersedes:** —

## Context and problem statement

Team members use AI coding agents (Claude Code and others). Agents load `CLAUDE.md` on every
session, so a long `CLAUDE.md` wastes context and buries the rules that matter. Yet agents must
know the architecture decisions and their history to avoid breaking them.

## Decision drivers

- Small always-loaded context.
- Decisions discoverable on demand, including superseded ones.
- Rules close to the code they govern.

## Considered options

1. Short root `CLAUDE.md` with an **ADR index**, nested per-app `CLAUDE.md`, and skills for recipes
2. One large `CLAUDE.md` with every rule
3. No agent-specific documentation

## Decision outcome

Chosen option: **index plus on-demand loading.**

- **Root `CLAUDE.md`** holds commands, non-negotiable rules and a table of every ADR
  (number, one-line decision, status, supersession), grouped by area. Agents open the full ADR
  only when they touch that area.
- **`apps/api/CLAUDE.md`** and **`apps/web/CLAUDE.md`** hold layer rules. Claude Code loads
  them automatically when working in those folders.
- **`AGENTS.md`** points other agents (Codex, Cursor, Copilot) to the same files.
- **Skills** in `.claude/skills/` hold step-by-step recipes: `new-adr`, `new-backend-module`
  and `new-frontend-feature`.
- When an ADR is added or superseded, the **same PR** updates the index in `CLAUDE.md`
  and in `docs/adr/README.md`.

### Consequences

- 👍 The always-loaded context stays small; history remains visible in the index.
- 👎 Two indexes to keep in sync. The `new-adr` skill does both.

## Enforcement

Review checklist; `new-adr` skill.

## References

- `CLAUDE.md`, `AGENTS.md`, `.claude/skills/*`
