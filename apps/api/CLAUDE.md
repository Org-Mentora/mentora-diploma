# API (apps/api): MVP Passive View + OOP

ADRs: 0004 (MVP), 0005 (OOP), 0006 (Singleton), 0007 (Adapter), 0008 (Mongo), 0009 (OpenAPI),
0024 (module dependencies), 0025 (transactions), 0026 (jobs), 0027 (email), 0029 (subscriptions), 0030 (WhatsApp),
0031 (video calls), 0033 (cross-module commands), 0040 (agenda lock, rate-limit store, access log).
Reference slice to copy: `src/modules/health`. Recipe: `.claude/skills/new-backend-module`.

## Layout

```
src/core/            base classes: Presenter, View/HttpView, InputParser, Entity, ValueObject,
                     Repository, DataMapper, TransactionManager, ApplicationError, AppModule,
                     ContractRegistry, ScheduledJob, JobLock, CalendarMonths, NoContentHttpView
src/infrastructure/  singletons + adapters: AppConfig, Logger(Pino), MongoConnection,
                     MongooseRepository, TransactionContext, MongoTransactionManager,
                     OpenApiRegistry, ExpressServer, ExpressResponderAdapter, MailTransport,
                     IntervalJobScheduler, MongoJobLock, MigrationLog, RateLimiter,
                     DateTimeFormatter
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
- **Auth (ADR-0018):** routers call `router.use(guard.requireActiveSubscription)`; views get the actor
  with `ActorReader.from(res)` and pass `{ actor, ... }` to presenters. Every query is scoped by
  `actor.professionalId` (ADR-0019); foreign data → `NotFoundError`.
- **Generic view:** `new JsonHttpView<Dto>(new ExpressResponderAdapter(res), 201)` for simple JSON.
- **Cross-module (ADR-0022):** owner exposes a query service in `index.ts`; the consumer Model declares
  its own abstract class and an adapter in its `infrastructure/` implements it. Wire in `src/app/modules.ts`.
- **Contracts:** nullable DTO refs use `nullableRef(Schema)` (ADR-0023).
- **Module dependencies (ADR-0024):** one `<Name>ModuleDependencies` object. Model ports are
  optional and default to the Mongoose adapter (`deps.repository ?? new MongooseXRepository(deps.context)`);
  the clock, guard, logger, transactions and Singleton-backed adapters come from `src/app/modules.ts`.
- **Transactions (ADR-0025):** Model services wrap write use cases in `transactions.run(async () => …)`;
  notifications go after `run`. Every repository query calls `.session(this.session)`.
- **External calls (ADR-0029..0031):** gateways, email and WhatsApp never run inside `run`; decide in one
  transaction, call outside, store the result in another. Retried transactions must not repeat side effects.
- **Jobs (ADR-0026):** `scheduledJobs()` in the module root; idempotent, one transaction per item.
- **Readiness (ADR-0037, ADR-0040):** public auth routes add `limiter.limit(RULE)` (429, counted in `MongoRateLimitStore`);
  one-off data fixes are `migrations()` of the module root, named `'<yyyy-mm>-<name>'`, run once per
  database by `Application.runMigrations()`; `/health/live` must never depend on MongoDB.
- **Comments (ADR-0035):** only `// <Pattern>` above the declaration. After adding or changing classes run
  `pnpm docs:classes` (CI runs `pnpm docs:check`).
- **Test seams:** `createModules({ clock, mail, whatsapp, payments, meetings })`; `TestApp.runJob(name)`.

## After changing contracts

`pnpm codegen` (from root) and commit the regenerated files.

## Tests

Presenter: `SpyView` + fakes. HTTP: supertest on `new Application([module]).createServer({ quiet: true }).app`.
Repositories: `MongoMemoryReplSet` from `mongodb-memory-server` (transactions need a replica set).
Whole API without Mongo: in-memory adapters in `test/support/inMemory.ts`, wired in
`test/integration/in-memory.http.test.ts`.
