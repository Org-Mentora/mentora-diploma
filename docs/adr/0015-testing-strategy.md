# ADR-0015: Testing strategy

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** Mentora team
- **Tags:** quality
- **Supersedes:** —

## Context and problem statement

The architecture is designed for testability (passive views, adapters, ViewModels). The test
suite should exploit that with fast, focused tests at each layer.

## Decision drivers

- Fast feedback, one test runner for the whole monorepo.
- Test each layer through its own seam.
- Real database behaviour for persistence adapters.

## Considered options

1. Vitest everywhere + supertest + mongodb-memory-server + Testing Library
2. Jest + Cypress
3. End-to-end tests only

## Decision outcome

Chosen option: **Vitest everywhere.**

| Layer | Tool | Seam / fake |
| --- | --- | --- |
| API model | Vitest | fake `Clock`, stub indicators/repositories |
| API presenter | Vitest | `SpyView` records `render`/`renderError` |
| API HTTP (views + routing + contracts) | supertest | module built with fake services |
| Persistence adapters | mongodb-memory-server | real MongoDB in memory |
| Web model adapters | Vitest | pure functions on DTO fixtures |
| Web ViewModel | `renderHook` | `vi.mock` of the generated hooks module |
| Web View | Testing Library | `vi.mock` of the ViewModel hook |

- API tests live in `apps/api/test/{unit,integration,support}`. Web tests sit next to the file
  (`*.test.ts(x)`).
- Every new use case adds at least: a presenter unit test and an HTTP test for its route.
- Every new screen adds: a ViewModel test and a View test.

### Consequences

- 👍 The suite runs in seconds (except the first in-memory MongoDB download).
- 👎 No browser E2E yet; consider Playwright in a future ADR.

## Enforcement

`pnpm test` in CI.

## References

- `apps/api/test/**`, `apps/web/src/**/*.test.ts(x)`
