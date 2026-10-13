# ADR-0001: Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** Mentora team
- **Tags:** process
- **Supersedes:** —

## Context and problem statement

Mentora is built by a team of students and AI coding agents. Decisions made early (architecture
patterns, tooling, conventions) are easily forgotten or silently contradicted, and agents have no
memory between sessions. We need a durable, reviewable history of *why* the system looks the way
it does.

## Decision drivers

- Decisions must survive team rotation and agent sessions.
- History must be visible: a reversed decision should still explain what came before.
- Low ceremony: one short Markdown file per decision.

## Considered options

1. Architecture Decision Records (MADR format) in `docs/adr/`
2. A single "architecture" wiki page
3. Rely on PR descriptions and commit history

## Decision outcome

Chosen option: **ADRs in MADR format**, stored in `docs/adr/NNNN-kebab-title.md`, indexed in
`docs/adr/README.md` and in the root `CLAUDE.md` (see [ADR-0017](0017-agent-context.md)).

Rules:

- Accepted ADRs are immutable. A change of mind is a **new** ADR with `Supersedes: ADR-XXXX`; the
  old one becomes `Superseded by ADR-YYYY`.
- Any PR that introduces a new library, layer, pattern or cross-cutting convention must add an ADR.

### Consequences

- 👍 Agents and new members can load exactly the decision they need.
- 👍 Superseded decisions remain as history.
- 👎 Small writing overhead per decision.

## Enforcement

Code review checklist; the `new-adr` agent skill (`.claude/skills/new-adr`) automates the steps.

## References

- <https://adr.github.io/madr/>
