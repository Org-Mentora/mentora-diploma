# AGENTS.md

Instructions for AI coding agents (Codex, Cursor, Copilot, Gemini, ...).

This project keeps its agent guidance in `CLAUDE.md` files. Read them before making changes:

1. [`CLAUDE.md`](CLAUDE.md): commands, non-negotiable rules, **ADR index**.
2. [`apps/api/CLAUDE.md`](apps/api/CLAUDE.md): API rules (MVP Passive View, OOP).
3. [`apps/web/CLAUDE.md`](apps/web/CLAUDE.md): web rules (MVVM, RTK Query codegen).
4. Step-by-step recipes in [`.claude/skills/`](.claude/skills/): `new-backend-module`,
   `new-frontend-feature`, `new-adr`.

Before finishing a task, run `pnpm lint && pnpm typecheck && pnpm test`.
