# ADR-0042: Dependency inversion for platform services

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** backend, frontend, patterns
- **Supersedes:** —

## Context and problem statement

Repositories, gateways, the clock, tokens and hashing already sit behind abstractions owned by
their consumers. An audit of the remaining direct dependencies found four that still pointed at a
concrete platform service:

- **API model:** eleven entity factories called the global `crypto.randomUUID()`. New ids could
  not be predicted in tests, and the id format could not change without editing the domain.
- **API notifiers:** the email and WhatsApp notifiers depended on the concrete `DateTimeFormatter`
  class from `infrastructure/format`.
- **Web ViewModels:** thirteen ViewModels imported `toast` from `sonner`, a third-party library,
  directly. Their tests had to mock the module.
- **Web ViewModels:** two ViewModels called `window.print()` and `navigator.clipboard` directly.

## Decision drivers

- Dependency Inversion Principle: high-level policy depends on abstractions it owns.
- Third-party libraries are reached through adapters ([ADR-0007](0007-adapter-pattern.md)).
- The same seam style as `Clock`: chosen in the composition root and replaced in tests.

## Considered options

1. Leave the direct calls and keep mocking modules in tests.
2. Ports owned by the consumer, implemented by adapters and injected from the composition root.

## Decision outcome

Chosen option: **2**.

### API

| Port | Implementation | Injected by |
| --- | --- | --- |
| `IdGenerator` (`core/model/IdGenerator.ts`) | `UuidIdGenerator` | `createModules` → `<Name>ModuleDependencies.ids` → services |
| `DateFormatter` (`core/format/DateFormatter.ts`) | `IntlDateFormatter` (`infrastructure/format`), renamed from `DateTimeFormatter` | `createModules` → notifiers |

- Entity factories receive the id as their first argument, for example
  `Patient.register(id, professionalId, details, now)`. Services call `this.ids.next()`.
- Adapters that need random values for an external system keep calling `crypto` directly. These
  are the local WhatsApp outbox, the simulated gateway and the Google Meet `requestId`. Those
  values are details of the adapter, not identities.
- `createModules({ ids })` lets tests choose ids, the same way they choose `clock`.

### Web

| Port | Implementation | Injected by |
| --- | --- | --- |
| `UserFeedback` (`model/platform`) | `SonnerUserFeedback` | `PlatformContext`, provided in `AppProviders` |
| `BrowserActions` (`model/platform`) | `WindowBrowserActions` | `PlatformContext`, provided in `AppProviders` |

- ViewModels call `useUserFeedback()` and `useBrowserActions()`.
- Tests wrap the hook in `<PlatformContext value={fake}>`. The default context value is the
  browser implementation, so older tests that mock `sonner` keep working.

### Not inverted, on purpose

- **Presenters still depend on their Model service classes.** Both live in the same module and
  the service is the Model's own API, so an interface per service would only duplicate it.
- **Routes still depend on `AuthGuard` and `RateLimiter`.** They are Express middlewares and
  the view layer is Express-specific by design ([ADR-0004](0004-backend-mvp-passive-view.md)).
- **ViewModels still use RTK Query hooks directly.** The hooks are generated from the contract
  and form the Model ([ADR-0010](0010-frontend-codegen.md)).

### Consequences

- 👍 The domain no longer touches a platform API to create identities, and tests can assert
  exact ids (`SequentialIds` in `test/support/fakes.ts`).
- 👍 Swapping the toast library, or adding analytics around messages, touches one adapter.
- 👎 One more constructor argument per service and one more context in the web.

## Enforcement

- `biome.json`: views and ViewModels may not import `sonner` (`[arch][DIP]`).
- `apps/api/test/unit/patient-model.test.ts` injects `SequentialIds`.
- `apps/web/src/features/virtual-consultations/viewmodel/useVirtualMeetingViewModel.test.tsx`
  injects a fake `Platform`.
- `biome.json`: the `crypto` global is denied under `apps/api/src/modules/*/model/**` (`noRestrictedGlobals`).

## References

- [ADR-0005](0005-backend-oop-conventions.md), [ADR-0007](0007-adapter-pattern.md),
  [ADR-0011](0011-frontend-mvvm.md), [ADR-0024](0024-injectable-module-adapters.md)
