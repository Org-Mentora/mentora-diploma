# Adding an ADR

1. Copy `docs/adr/template.md` to `docs/adr/NNNN-kebab-title.md`, using the next free number.
2. Fill in context, options, decision, consequences and **enforcement**.
3. If it replaces a decision:
   - set `Supersedes: ADR-XXXX` in the new ADR;
   - edit **only the status line** of the old ADR to `Superseded by [ADR-NNNN](...)`.
4. Add a row to the index in `docs/adr/README.md`.
5. Add a row to the **ADR index in the root `CLAUDE.md`**, in the right area group, with the
   one-line decision. For superseded ADRs, keep the row, mark it `~~superseded~~ → NNNN` and keep
   it in the table. That is the decision history agents rely on.
6. If the decision adds a rule that tooling can check, add it to `biome.json` or a Grit plugin
   in `tools/biome/` in the same PR.

Agents: use the `new-adr` skill (`.claude/skills/new-adr/SKILL.md`).
