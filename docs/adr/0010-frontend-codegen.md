# ADR-0010: Generated DTO types and RTK Query hooks

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** Mentora team
- **Tags:** api, frontend
- **Supersedes:** —

## Context and problem statement

The frontend must consume the API with exact types and without hand-written fetch code.
Hand-maintained DTOs and endpoints drift from the backend and duplicate work.

## Decision drivers

- Zero hand-written HTTP or DTO code in the SPA.
- A single command regenerates everything.
- CI must detect a stale client.

## Considered options

1. `openapi-typescript` (DTO layer) + `@rtk-query/codegen-openapi` (endpoints and hooks)
2. Orval (no RTK Query support)
3. Hand-written RTK Query slices

## Decision outcome

Chosen option: **two generators fed by the same OpenAPI document.**

```
pnpm codegen
  └─ @mentora/api        openapi:generate → packages/contracts/openapi.json
     └─ @mentora/contracts  generate      → packages/contracts/src/dtos.generated.ts
        └─ @mentora/web     codegen       → apps/web/src/model/api/generated/mentoraApi.ts
```

- **DTO typing layer:** `@mentora/contracts` exports one type per schema (`HealthDto`,
  `ErrorResponseDto`, ...) via `openapi-typescript --root-types`. The web `model/domain`
  adapters import DTOs from here.
- **RTK Query layer:** `mentoraApi.ts` injects the endpoints into `baseApi`
  (`src/model/api/baseApi.ts`), with tags and hooks (`useGetHealthQuery`). Only ViewModels use
  these hooks.
- Generated files are **committed**, excluded from Biome, and must **never be edited by hand**.
- `fetch()` is forbidden in features/shared/app (GritQL plugin `no-fetch-outside-model.grit`).

### Consequences

- 👍 A backend change → `pnpm codegen` → TypeScript errors show every place the UI must adapt.
- 👎 Two generated artefacts with structurally identical DTO types. Convention: import DTOs from
  `@mentora/contracts`, and hooks from `model/api/generated`.

## Enforcement

`pnpm codegen:check` (CI) runs codegen and fails on `git diff`. Biome rules restrict where
generated hooks and DTOs can be imported ([ADR-0011](0011-frontend-mvvm.md)).

## References

- [docs/guides/codegen.md](../guides/codegen.md)
