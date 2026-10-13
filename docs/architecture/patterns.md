# Design patterns in use

## Singleton — [ADR-0006](../adr/0006-singleton-pattern.md)

| Class | File |
| --- | --- |
| `AppConfig` | `apps/api/src/infrastructure/config/AppConfig.ts` |
| `Logger` | `apps/api/src/infrastructure/logger/Logger.ts` |
| `MongoConnection` | `apps/api/src/infrastructure/database/MongoConnection.ts` |
| `OpenApiRegistry` | `apps/api/src/infrastructure/openapi/OpenApiRegistry.ts` |
| `AppStore` | `apps/web/src/app/store/AppStore.ts` |

Rules: private constructor (lint-enforced), `static #instance`, lazy `getInstance()`,
`resetInstance()` for tests. Only composition roots call `getInstance()`; everything else gets the
instance injected.

## Adapter — [ADR-0007](../adr/0007-adapter-pattern.md)

| Our abstraction | Adapter | Wraps |
| --- | --- | --- |
| `Repository<T>` | `MongooseRepository` (+ per-entity subclasses) | Mongoose models |
| `AppLogger` | `PinoLoggerAdapter` | pino |
| `HttpResponder` | `ExpressResponderAdapter` | Express `Response` |
| `ContractRegistry` | `OpenApiRegistry` | zod-to-openapi |
| `HealthIndicator` | `MongoHealthIndicator` | `MongoConnection` |
| `UptimeSource` | `ProcessUptimeSource` | `process.uptime()` |
| UI model | `HealthAdapter` | generated `HealthDto` |
| `UiError` | `ApiErrorAdapter` | RTK Query error union |

## Other patterns that appear by design

| Pattern | Where |
| --- | --- |
| **Template Method** | `Presenter.present()` calls the abstract `execute()`; `HttpView.render()` calls `serialize()` |
| **Factory** | `<Name>PresenterFactory` (implemented by each module) builds a presenter per request |
| **Data Mapper** | `DataMapper<Entity, Document>` used by repositories |
| **Composition Root** | `<Name>Module.ts`, `Application.ts`, `main.ts` |
| **Observer** | RTK Query subscriptions that drive ViewModel re-renders |
