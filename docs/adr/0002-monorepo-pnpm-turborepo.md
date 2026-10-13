# ADR-0002: Monorepo with pnpm workspaces and Turborepo

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** Mentora team
- **Tags:** tooling
- **Supersedes:** —

## Context and problem statement

The product consists of an Express API and a Vite/React SPA that share an API contract. Keeping
them in separate repositories would make every contract change a multi-repo coordination problem
and would prevent generating the frontend client from the backend in a single step.

## Decision drivers

- Atomic changes across API, contract and frontend.
- Fast, cached task orchestration (build, test, codegen).
- Strict dependency isolation (no phantom dependencies).

## Considered options

1. pnpm workspaces + Turborepo
2. npm/yarn workspaces + Nx
3. Two repositories plus a published contract package

## Decision outcome

Chosen option: **pnpm workspaces + Turborepo**.

```
apps/api            Express API (@mentora/api)
apps/web            Vite + React SPA (@mentora/web)
packages/contracts  Generated OpenAPI + DTO types (@mentora/contracts)
packages/tsconfig   Shared tsconfig presets (@mentora/tsconfig)
```

- The pnpm version is pinned in `packageManager`; dependency versions are pinned exactly.
- Build scripts of dependencies are opt-in (`allowBuilds` in `pnpm-workspace.yaml`).
- Turborepo runs `build`, `typecheck`, `test`, `dev` and the `codegen` pipeline
  (`openapi:generate → generate → codegen`, see [ADR-0010](0010-frontend-codegen.md)).

### Consequences

- 👍 One PR can change an endpoint, regenerate the client and update the UI.
- 👍 pnpm's strict `node_modules` prevents importing undeclared packages.
- 👎 Contributors need pnpm (`corepack enable` or `npm i -g pnpm`).

## Enforcement

`pnpm install --frozen-lockfile` in CI; Turborepo task graph in `turbo.json`.

## References

- <https://pnpm.io/workspaces> · <https://turborepo.com/docs>
