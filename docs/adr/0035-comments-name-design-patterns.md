# ADR-0035: Code comments only name the design pattern

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** process, patterns, tooling
- **Supersedes:** —

## Context and problem statement

Comments had grown into notes about use case steps, ADR numbers and implementation details.
They duplicated the ADRs, the use case specification and the tests, and they went stale when
the code changed. The team wants the code to explain itself, and comments to point out only
where a design pattern is applied.

## Decision drivers

- One source of truth: decisions live in ADRs, behaviour in tests, use cases in `docs/product`.
- Make the patterns of the architecture (MVP, MVVM, Adapter, Repository...) visible in the code.
- A rule that a machine can check.

## Considered options

1. Only comments that name the pattern, checked by a script.
2. Free comments with a review guideline.
3. No comments at all.

## Decision outcome

Chosen option: **1. Pattern-name comments, checked by a script.**

- A comment is allowed only right above a declaration that implements a pattern, and it contains
  only the pattern name: `// Adapter`, or several separated by commas: `// Repository, Adapter`.
- The allowed names are listed in `tools/comments/check-comments.mjs`: Abstract Factory, Adapter,
  Aggregate Root, Command, Composition Root, Data Mapper, Entity, Facade, Passive View, Presenter,
  Repository, Singleton, State, Strategy, Template Method, Unit of Work, Value Object, ViewModel.
  Adding a pattern means adding it to that list and to `docs/architecture/patterns.md`.
- Tool directives stay (`biome-ignore`, `@ts-expect-error`, `@vite-ignore`...).
- Generated files are excluded. Configuration files (YAML, Dockerfiles, nginx, `.env.example`)
  keep their comments: they are operations documentation, not code.
- Anything else goes to the ADRs, the guides or a test name.

### Consequences

- 👍 Comments can no longer go stale or contradict the ADRs.
- 👍 Searching `// Adapter` lists every adapter.
- 👎 Non-obvious code must be made obvious (names, small functions) or explained in the docs.

## Enforcement

- `pnpm lint` runs `pnpm lint:comments` after Biome; the Lefthook pre-commit hook and CI run it too.

## References

- ADR-0006, ADR-0007, `docs/architecture/patterns.md`
