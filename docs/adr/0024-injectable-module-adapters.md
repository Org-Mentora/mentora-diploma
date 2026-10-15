# ADR-0024: Injectable module adapters with production defaults

- **Status:** Accepted
- **Date:** 2026-10-15
- **Deciders:** Mentora team
- **Tags:** backend
- **Supersedes:** —

## Context and problem statement

The Model already owns its abstractions (`PatientRepository`, `AppointmentNotifier`,
`HealthIndicator`, ...) and services receive them through their constructor
([ADR-0005](0005-backend-oop-conventions.md)). But each module composition root hard-wired the
concrete adapter (`new MongoosePatientRepository()`), the health module fetched the
`MongoConnection` Singleton and created its own clock, and the DSM-5 seeder was a concrete
class the module called directly. A module could not run without MongoDB, so a different
adapter (in-memory for tests, WhatsApp for CU-14) meant editing the module.

## Decision drivers

- Dependency inversion all the way to the composition root, not only inside the Model.
- Singletons are turned into dependencies only in `src/app/modules.ts`
  ([ADR-0006](0006-singleton-pattern.md)).
- No DI container and no ceremony for the production wiring.
- No interfaces where nothing is being inverted.

## Considered options

1. Optional adapters in each `<Name>ModuleDependencies`, defaulting to the production adapter
2. Required adapters, built in `src/app/modules.ts`
3. A DI container (tsyringe/inversify)

## Decision outcome

Chosen option: **optional adapters with production defaults.**

- Every module takes one `<Name>ModuleDependencies` object. Each port the Model owns is an
  optional field typed with the abstraction (`repository?: PatientRepository`,
  `notifier?: AppointmentNotifier`, `seeder?: DiagnosisCatalogSeeder`). The module uses
  `deps.x ?? new ProductionAdapter()`.
- Collaborators that depend on process-wide state are required and come from
  `src/app/modules.ts`: the shared `Clock`, the `AuthGuard`, the logger and the health
  indicators (`new MongoHealthIndicator(MongoConnection.getInstance())`).
- Repository ports stay private to their module: `index.ts` exports the dependencies type, not
  the repository. Other modules still use query services ([ADR-0022](0022-cross-module-collaboration.md)).
- Seeding reference data is a Model-owned port (`DiagnosisCatalogSeeder`), with
  `MongooseDiagnosisCatalogSeeder` as its adapter.
- Not inverted on purpose: `AuthGuard` and `SessionCookie` (Express-only, consumed by views),
  the pino logger of `ExpressServer` (`pino-http` needs the native instance) and entity id
  generation.

Option 2 would make `src/app/modules.ts` import every module's infrastructure through its
public index. Option 3 contradicts ADR-0005.

### Consequences

- 👍 The whole API runs on in-memory adapters (`test/support/inMemory.ts`), no MongoDB needed.
- 👍 The WhatsApp notifier of CU-14 plugs in through `AppointmentsModuleDependencies.notifier`.
- 👎 The production adapter is still named inside the module, as a default.

## Enforcement

`test/integration/in-memory.http.test.ts` wires every module to in-memory adapters and fails
if a module ignores an injected port. Review and the
[new-backend-module skill](../../.claude/skills/new-backend-module/SKILL.md).

## References

- `apps/api/src/app/modules.ts`, `apps/api/src/modules/*/<Name>Module.ts`
- `apps/api/test/support/inMemory.ts`
