# ADR-0013: Biome for linting, formatting and architecture rules

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** Mentora team
- **Tags:** tooling, architecture
- **Supersedes:** —

## Context and problem statement

Two different architectures (MVP in the API, MVVM in the SPA) must be respected by every
contributor, human or AI. Rules that live only in documents get broken, so they must fail the build.

## Decision drivers

- One fast tool for formatting and linting.
- Architecture rules expressed as configuration, with messages that point to the relevant ADR.
- Runs locally (git hook) and in CI.

## Considered options

1. Biome 2 (`noRestrictedImports` per-path overrides + GritQL plugins)
2. ESLint + Prettier + eslint-plugin-boundaries / dependency-cruiser
3. Documentation and code review only

## Decision outcome

Chosen option: **Biome 2** (`biome.json`) for formatting, linting and architecture.

Architecture rules:

1. **Layer boundaries:** an `overrides` entry per layer glob (for example
   `apps/api/src/modules/*/presenter/**`) configures `style/noRestrictedImports` with forbidden
   packages (`paths`) and forbidden import globs (`patterns`). Each message starts with
   `[arch]`, `[arch][MVP]` or `[arch][MVVM]` and cites the ADR.
2. **Module isolation:** `../../**` is forbidden inside API modules, and `@/features/*/**` deep
   imports are forbidden in web features. `#modules/<name>` resolves only to the module index.
3. **Cycles:** `suspicious/noImportCycles` is an error.
4. **Configuration access:** `style/noProcessEnv` is an error in the API except in `AppConfig.ts`.
5. **GritQL plugins** in `tools/biome/`:
   - `singleton-private-constructor.grit`: a class with `static getInstance()` must have a
     private constructor ([ADR-0006](0006-singleton-pattern.md)).
   - `no-fetch-outside-model.grit`: no `fetch()` in web features/shared/app
     ([ADR-0010](0010-frontend-codegen.md)).

Notes:

- Overrides do not merge options for the same rule. **Each file must match a single
  `noRestrictedImports` override**, so keep layer globs disjoint.
- Plugin scoping uses `overrides[].plugins`. The top-level plugin `includes` field did not
  match on Windows paths with Biome 2.5.
- Generated files (`*.generated.ts`, `model/api/generated`, `openapi.json`) are excluded.

Workflow: `pnpm lint` (check), `pnpm lint:fix` (write), Lefthook runs Biome on staged files
before each commit and validates Conventional Commit messages. CI runs `biome ci`.

### Consequences

- 👍 An architecture violation is a red build with a message that cites the ADR.
- 👎 Import-based rules cannot catch everything (for example, logic placed in a View). Code
  review still applies.

## Enforcement

This ADR describes the enforcement itself. Adding a new layer or folder means adding its
override in the same PR.

## References

- `biome.json`, `tools/biome/*.grit`, `lefthook.yml`
