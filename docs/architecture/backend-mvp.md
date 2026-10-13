# Backend architecture — MVP (Passive View)

Decision: [ADR-0004](../adr/0004-backend-mvp-passive-view.md). OOP rules: [ADR-0005](../adr/0005-backend-oop-conventions.md).

## The three roles

| Role | Responsibility | Knows | Never knows |
| --- | --- | --- | --- |
| **Model** | Business rules, entities, value objects, services, abstract repositories | `#core/model`, `#core/errors` | HTTP, Mongoose, DTOs, presenters, views |
| **Presenter** | One use case: receives typed input, calls the Model, builds the output DTO, tells the View what to render | Model, contracts (types), `View<T>` interface | Express, Mongoose, concrete views |
| **View (passive)** | Translate transport ↔ presenter: parse request input, render the DTO with a status code | Presenter (via factory), contracts, `HttpResponder` | Model, persistence |

The **module composition root** (`<Name>Module.ts`) is the only place that instantiates all of
them. It implements `AppModule` (router + contracts) and the module's `PresenterFactory`.

## Anatomy of a module

```
modules/health/
  model/
    ComponentHealth.ts         ValueObject
    HealthReport.ts            ValueObject with the "ok/degraded" business rule
    HealthIndicator.ts         abstract class owned by the Model
    HealthService.ts           Model service
  infrastructure/
    MongoHealthIndicator.ts    Adapter → HealthIndicator
    ProcessUptimeSource.ts     Adapter → UptimeSource
  contracts/
    health.contracts.ts        zod DTOs (.meta id) + registerHealthContracts()
  presenter/
    GetHealthPresenter.ts      extends Presenter<void, HealthDto>
    HealthPresenterFactory.ts  interface used by the routes
  view/
    HealthHttpView.ts          extends HttpView<HealthDto>
    HealthRoutes.ts            Express router: view + presenter per request
  HealthModule.ts              composition root
  index.ts                     public API (module class + DTO types)
```

## Core building blocks (`src/core`)

| Class / interface | Purpose |
| --- | --- |
| `Presenter<TIn, TVm>` | Template method `present()` → `execute()`; renders `ApplicationError`s via `view.renderError`, re-throws the rest |
| `View<TVm>` | `render(vm)` / `renderError(errorVm)` |
| `HttpView<TVm>` | Passive JSON view; maps error `kind` → HTTP status; `successStatus` per subclass (201 for creates) |
| `HttpResponder` | Output port implemented by `ExpressResponderAdapter` |
| `InputParser` | `parse(schema, raw)` → typed input or `ValidationError` (400) |
| `Entity`, `ValueObject` | Domain base classes |
| `Repository<T>`, `DataMapper` | Persistence abstractions implemented by `MongooseRepository` |
| `ApplicationError` + subclasses | `validation · not_found · conflict · unauthorized · forbidden` |
| `AppModule`, `ContractRegistry`, `RouteContract` | Module and OpenAPI registration contracts |

## A typical write use case (sketch)

```ts
// view/MentorRoutes.ts
router.post('/', async (req, res) => {
  const view = new CreateMentorHttpView(new ExpressResponderAdapter(res)); // successStatus = 201
  const input = InputParser.parse(CreateMentorRequestSchema, req.body);
  await this.presenters.createMentor(view).present(input);
});

// presenter/CreateMentorPresenter.ts
protected async execute(input: CreateMentorRequestDto): Promise<MentorDto> {
  const mentor = await this.service.register(input.name, input.email); // Model
  return MentorPresenterMapper.toDto(mentor);
}
```

## Error handling

1. The Model throws `ApplicationError` subclasses.
2. The Presenter catches them and calls `view.renderError(...)`. The `HttpView` then answers with
   the mapped status and an `ErrorResponseDto`.
3. Validation errors thrown by views before `present()`, and unknown errors, reach
   `HttpErrorHandler`. It renders known errors the same way and turns everything else into a
   logged 500.

## Enforcement

See the rule table in ADR-0004 and the `overrides` in `biome.json`. Run `pnpm lint`.
