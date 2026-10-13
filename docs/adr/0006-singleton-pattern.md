# ADR-0006: Singleton pattern for process-wide resources

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** Mentora team
- **Tags:** patterns
- **Supersedes:** —

## Context and problem statement

Some resources must exist exactly once per process: the validated configuration, the logger, the
database connection, the OpenAPI registry, and the Redux store in the browser. Creating them ad
hoc leads to duplicated connections, inconsistent configuration and hard-to-test globals.

## Decision drivers

- Exactly one instance of shared, expensive or stateful resources.
- Lazy initialisation, so the OpenAPI script can run without a database.
- Testability: tests must be able to reset the instance.

## Considered options

1. Classic Singleton class (private constructor + static `getInstance()`)
2. Module-level `export const instance = ...`
3. DI container scopes

## Decision outcome

Chosen option: **classic Singleton**, used only for the following classes:

| Singleton | Where | Why |
| --- | --- | --- |
| `AppConfig` | `apps/api/src/infrastructure/config` | Parses and validates `process.env` once (zod) |
| `Logger` | `apps/api/src/infrastructure/logger` | One pino instance (exposed through `PinoLoggerAdapter`) |
| `MongoConnection` | `apps/api/src/infrastructure/database` | One Mongoose connection per process |
| `OpenApiRegistry` | `apps/api/src/infrastructure/openapi` | One registry collecting all route contracts |
| `AppStore` | `apps/web/src/app/store` | One Redux store for the SPA (`AppStore.create()` for tests) |

Shape:

```ts
export class AppConfig {
  static #instance: AppConfig | undefined;
  private constructor(readonly env: Env) {}
  static getInstance(): AppConfig {
    AppConfig.#instance ??= new AppConfig(parse(process.env));
    return AppConfig.#instance;
  }
  static resetInstance(): void { AppConfig.#instance = undefined; } // tests only
}
```

- Singletons live in `infrastructure/` (API) or `app/` (web), **never in the Model**.
- Business classes receive the instance through their constructor; they do not call
  `getInstance()` themselves. Only composition roots and bootstrap code do.
- Only `AppConfig` may read `process.env`.

### Consequences

- 👍 One connection, one configuration, one registry — guaranteed by the type system.
- 👎 Hidden global state if misused; mitigated by injecting instances.

## Enforcement

- TypeScript: the private constructor makes `new AppConfig()` a compile error.
- Biome GritQL plugin `tools/biome/singleton-private-constructor.grit`: any class with a
  `static getInstance()` must declare a private constructor.
- Biome `noProcessEnv` is an error in `apps/api/src/**` except `AppConfig.ts`.

## References

- Tests: `apps/api/test/unit/singletons.test.ts`
