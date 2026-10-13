# ADR-0007: Adapter pattern at every technology boundary

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** Mentora team
- **Tags:** patterns
- **Supersedes:** —

## Context and problem statement

MVP keeps the Model and Presenters independent from frameworks, but they still need persistence,
logging, HTTP output and API documentation. On the frontend, ViewModels need DTOs turned into
display-ready data. Each of these is an interface mismatch between our abstractions and a
third-party API.

## Decision drivers

- Swap or upgrade a library without touching the Model, Presenters or Views.
- Keep third-party types out of business code.
- Make fakes trivial in tests.

## Considered options

1. Adapter classes that implement our abstractions and wrap the library
2. Use library APIs directly everywhere
3. Facade modules with free functions

## Decision outcome

Chosen option: **Adapter classes** named `*Adapter`, or `Mongoose*Repository` /
`*Indicator` when they implement a Model abstraction.

| Target (our abstraction) | Adaptee (library) | Adapter |
| --- | --- | --- |
| `Repository<T>` (core/model) | Mongoose `Model` | `MongooseRepository` base + `Mongoose<Entity>Repository` per module |
| `AppLogger` (core/logging) | pino | `PinoLoggerAdapter` |
| `HttpResponder` (core/view) | Express `Response` | `ExpressResponderAdapter` |
| `ContractRegistry` (core/module) | `@asteasolutions/zod-to-openapi` | `OpenApiRegistry` |
| `HealthIndicator` (health/model) | `MongoConnection` | `MongoHealthIndicator` |
| `UptimeSource` (health/model) | `process.uptime()` | `ProcessUptimeSource` |
| UI model (web) | `HealthDto` (generated) | `HealthAdapter` (`model/domain`) |
| `UiError` (web) | RTK Query error union | `ApiErrorAdapter` (`model/api`) |

Persistence adapters also use a **Data Mapper** (`DataMapper<Entity, Document>`) so Mongoose
documents never leak into the Model.

### Consequences

- 👍 Libraries are swappable behind a single class.
- 👍 Unit tests replace adapters with in-memory fakes.
- 👎 One extra class per boundary.

## Enforcement

The Biome layer rules ([ADR-0013](0013-biome-architecture-linting.md)) stop `mongoose`, `express`
and `pino` imports from leaking into model/presenter/core, which leaves adapters as the only
possible place for them.

## References

- `apps/api/src/infrastructure/**`, `apps/api/src/modules/*/infrastructure/**`, `apps/web/src/model/**`
