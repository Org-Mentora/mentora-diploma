---
name: new-adr
description: Record a new Architecture Decision Record or supersede an existing one in docs/adr, and keep the ADR indexes in docs/adr/README.md and the root CLAUDE.md in sync. Use when introducing a new library, layer, pattern or convention, or when reversing a previous decision.
---

# New ADR

1. Find the next number: list `docs/adr/` and take the highest `NNNN` + 1 (never reuse numbers).
2. Copy `docs/adr/template.md` to `docs/adr/NNNN-kebab-case-title.md` and fill in every section.
   Keep it short and concrete. The **Enforcement** section must say how the decision is kept
   true (Biome rule, Grit plugin, test, CI step or review).
3. If it supersedes ADR-XXXX:
   - set `**Supersedes:** [ADR-XXXX](XXXX-....md)` in the new file;
   - in the old file change **only** its status line to
     `**Status:** Superseded by [ADR-NNNN](NNNN-....md)`. Do not edit anything else.
4. Add a row to the table in `docs/adr/README.md`.
5. Update the **ADR index in the root `CLAUDE.md`**:
   - add a row in the matching area group, with a one-line decision;
   - for a superseded ADR, keep its row and change it to
     `~~old decision~~ → superseded by [NNNN](...)`, with status `Superseded`.
6. If the decision is checkable by tooling, add the rule to `biome.json` (per-layer override)
   or a GritQL plugin in `tools/biome/` and attach it through `overrides[].plugins`. Then prove it
   fires with a temporary violating file, and delete that file.
7. Run `pnpm lint`.
8. Commit with `docs(adr): add ADR-NNNN <title>`.
