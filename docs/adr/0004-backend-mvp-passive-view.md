# ADR-0004: Backend architecture — MVP (Passive View)

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** Mentora team
- **Tags:** backend, architecture
- **Supersedes:** —

## Context and problem statement

The API needs an object-oriented architecture that keeps business rules independent from HTTP and
from the database, maps cleanly to use cases (CU), and is not one of MVC, MVVM or Hexagonal
(a course requirement for this project).

## Decision drivers

- Business rules testable without Express or MongoDB.
- One clear class per use case, so each CU from the specification has an obvious home.
- Thin, "dumb" HTTP layer.
- Rules simple enough to be enforced by a linter.

## Considered options

1. **MVP — Passive View** (Model / Presenter / passive View)
2. Vertical slices + CQRS
3. Clean Architecture (too close to Hexagonal)
4. Classic MVC (excluded)

## Decision outcome

Chosen option: **MVP with Passive View**, organised in feature modules.

```
apps/api/src/
  core/                 framework-agnostic base classes (Presenter, HttpView, Entity, ValueObject,
                        Repository, ApplicationError, AppModule, ContractRegistry)
  infrastructure/       shared technical services: AppConfig, Logger, MongoConnection,
                        OpenApiRegistry, Express server + adapters
  modules/<name>/
    model/              entities, value objects, services, abstract repositories (pure TS)
    infrastructure/     Mongoose schemas + repository adapters, other technology adapters
    presenter/          one Presenter per use case + PresenterFactory interface
    view/               passive HTTP views + routes
    contracts/          zod DTO schemas + OpenAPI route contracts
    <Name>Module.ts     composition root (the only file that sees every layer)
    index.ts            public API of the module
```

**Request flow.** `Routes` (view) → builds a `XxxHttpView` bound to the response through
`ExpressResponderAdapter` → validates input with `InputParser` + the contract schema → asks the
`PresenterFactory` for a presenter → `presenter.present(input)` → presenter calls the **Model**,
maps the result to a DTO (the view model) → `view.render(dto)` or `view.renderError(error)`.

**Why "passive".** The View never reads the Model and never decides anything; it only renders
what the Presenter pushes. This is what distinguishes MVP from MVC, where the view observes the model.

Dependency rules:

| Layer | May import | Must not import |
| --- | --- | --- |
| model | `#core/model`, `#core/errors`, its own model files | express, mongoose, zod, presenter, view, contracts, infrastructure |
| presenter | model, contracts, `#core/presenter`, `#core/view/View` | express, mongoose, view, infrastructure |
| view | presenter, contracts, `#core/view`, `#infrastructure/http` | model, mongoose, module infrastructure |
| module infrastructure | model, `#infrastructure/*`, mongoose | presenter, view, express |
| contracts | zod, `#core/contracts`, `#core/module/ContractRegistry` | everything else |
| core | zod, express types | `#infrastructure/*`, `#modules/*`, mongoose, pino |
| other modules | `#modules/<name>` (index only) | deep imports |

### Consequences

- 👍 Presenters are unit-testable with a `SpyView` and fake model collaborators.
- 👍 A use case = a Presenter class: direct traceability to CU documents.
- 👎 More classes per feature than a plain controller approach.

## Enforcement

`noRestrictedImports` overrides per layer in `biome.json` ([ADR-0013](0013-biome-architecture-linting.md)).
Violations fail `pnpm lint` and CI with an `[arch][MVP]` message that points back here.

## References

- [docs/architecture/backend-mvp.md](../architecture/backend-mvp.md)
- Reference slice: `apps/api/src/modules/health`
