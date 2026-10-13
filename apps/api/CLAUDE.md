# API (apps/api): MVP Passive View + OOP

ADRs: 0004 (MVP), 0005 (OOP), 0006 (Singleton), 0007 (Adapter), 0008 (Mongo), 0009 (OpenAPI).
Reference slice to copy: `src/modules/health`. Recipe: `.claude/skills/new-backend-module`.

## Layout

```
src/core/            base classes: Presenter, View/HttpView, InputParser, Entity, ValueObject,
                     Repository, DataMapper, ApplicationError, AppModule, ContractRegistry
src/infrastructure/  singletons + adapters: AppConfig, Logger(Pino), MongoConnection,
                     MongooseRepository, OpenApiRegistry, ExpressServer, ExpressResponderAdapter
src/modules/<m>/     model/ infrastructure/ presenter/ view/ contracts/ <M>Module.ts index.ts
src/app/             Application (composition root), modules.ts (register modules here)
test/                unit/ integration/ support/ (fakes: SpyView, FixedClock, ...)
```

## Layer rules (lint-enforced)

- **model:** pure TS. Imports only `#core/model/*`, `#core/errors/*` and its own files.
  No express, mongoose, zod, DTOs or `#infrastructure`.
- **presenter:** one class per use case, `extends Presenter<Input, OutputDto>`. Uses model +
  contract types + the `View<T>` interface. No express, mongoose, views or infrastructure.
- **view:** passive. `XxxHttpView extends HttpView<Dto>` (set `successStatus`), and `XxxRoutes`
  builds the view, runs `InputParser.parse(schema, req.x)`, then calls
  `factory.useCase(view).present(input)`. Never imports the model.
- **infrastructure (module):** Mongoose schema, `Mongoose<X>Repository extends
  MongooseRepository`, mappers and other adapters. Never imports presenter or view.
- **contracts:** zod schemas with `.meta({ id: 'XxxDto' })` + `registerXxxContracts(registry)`.
- **Cross-module:** only `#modules/<name>` (the index). `../../` is forbidden.
- Only `AppConfig` reads `process.env`. Only composition roots call `getInstance()`.

## After changing contracts

`pnpm codegen` (from root) and commit the regenerated files.

## Tests

Presenter: `SpyView` + fakes. HTTP: supertest on `new Application([module]).createServer({ quiet: true }).app`.
Repositories: `mongodb-memory-server`.
