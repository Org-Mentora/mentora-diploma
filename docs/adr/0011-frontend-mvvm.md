# ADR-0011: Frontend architecture — MVVM

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** Mentora team
- **Tags:** frontend, architecture
- **Supersedes:** —

## Context and problem statement

React components tend to mix data fetching, formatting, state and markup. We want views that
are trivial to test and redesign, and a clear place for presentation logic.

## Decision drivers

- Views as pure rendering of state + forwarding of user intents.
- Presentation logic testable without rendering.
- A structure that maps to features (use cases).

## Considered options

1. MVVM with ViewModel hooks
2. Container/Presentational components
3. Feature-Sliced Design

## Decision outcome

Chosen option: **MVVM**, organised by feature.

```
apps/web/src/
  app/                 shell: AppStore (singleton), providers, router, layout
  model/
    api/               baseApi, generated RTK Query endpoints/hooks, ApiErrorAdapter
    domain/<feature>/  DTO → UI-model adapters (and client-side domain rules)
  features/<feature>/
    viewmodel/         use<Name>ViewModel.ts: binds hooks → state + commands
    view/              <Name>Page.tsx and feature components (pure rendering)
    index.ts           public API (routed pages)
  shared/
    ui/                shadcn/ui components (generic)
    lib/               generic helpers (cn)
```

- **Model**: generated API + DTO types + adapters. No React components.
- **ViewModel**: a hook that returns a typed object `{ state..., commands... }`. It uses the
  generated hooks and the adapters, and never returns DTOs or JSX.
- **View**: calls exactly one ViewModel hook and renders. It may hold ephemeral UI state
  (an open dialog, for instance) with `useState`, but no data fetching or business formatting.

| Layer | May import | Must not import |
| --- | --- | --- |
| view | its viewmodel, `@/shared/ui`, `@/shared/lib`, react, lucide | `@/model/**`, `@reduxjs/toolkit`, `react-redux`, `@mentora/contracts` |
| viewmodel | `@/model/**`, `@mentora/contracts`, react, react-redux, react-router | views, `@/shared/ui`, `react-dom`, `baseApi` |
| model | `@reduxjs/toolkit`, `@mentora/contracts` | `@/features`, `@/shared/ui`, `@/app`, `react-dom`, `react-router` |
| shared | react, UI libs | `@/features`, `@/model`, `@/app` |
| other features | `@/features/<name>` (index only) | deep imports |

### Consequences

- 👍 Views are tested by mocking a single ViewModel hook; ViewModels by mocking generated hooks.
- 👎 A small amount of boilerplate (ViewModel interface) per screen.

## Enforcement

`noRestrictedImports` overrides in `biome.json` plus the `no-fetch-outside-model.grit` plugin.
Violations report `[arch][MVVM]`.

## References

- [docs/architecture/frontend-mvvm.md](../architecture/frontend-mvvm.md)
- Reference slice: `apps/web/src/features/health`
