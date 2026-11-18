# Backend architecture — MVP (Passive View)

Decision: [ADR-0004](../adr/0004-backend-mvp-passive-view.md). OOP rules: [ADR-0005](../adr/0005-backend-oop-conventions.md).
Less boilerplate: [ADR-0049](../adr/0049-less-boilerplate.md).

## The three roles

| Role | Responsibility | Knows | Never knows |
| --- | --- | --- | --- |
| **Model** | Business rules, entities, value objects, services, abstract repositories | `#core/model`, `#core/errors` | HTTP, Mongoose, DTOs, presenters, views |
| **Presenter** | One use case: receives typed input, calls the Model, builds the output DTO, tells the View what to render | Model, contracts (types), `View<T>` interface | Express, Mongoose, concrete views |
| **View (passive)** | Translate transport ↔ presenter: parse request input, render the DTO with a status code | Presenter (via `<Name>Presenters`), contracts, `HttpResponder` | Model, persistence |

The **module composition root** (`<Name>Module.ts`) is the only place that instantiates all of
them. It implements `AppModule` (router + contracts) and passes a `<Name>Presenters` registry to
the routes.

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
    GetHealthPresenter.ts      extends Presenter<void, HealthDto, HealthService>
    HealthPresenters.ts        Abstract Factory: one method per use case, used by the routes
  view/
    ReadinessHttpView.ts       a view with its own rule (503 when degraded)
    HealthRoutes.ts            Express router: view + presenter per request
  HealthModule.ts              composition root
  index.ts                     public API (module class + DTO types)
```

## Core building blocks (`src/core`)

| Class / interface | Purpose |
| --- | --- |
| `Presenter<TIn, TVm, TModel>` | Receives `(view, model)`. Template method `present()` → `execute()`; renders `ApplicationError`s via `view.renderError`, re-throws the rest |
| `View<TVm>` | `render(vm)` / `renderError(errorVm)` |
| `HttpView<TVm>` | Passive JSON view; maps error `kind` → HTTP status; `JsonHttpView` takes the success status |
| `HttpViews` (`infrastructure/http`) | `HttpViews.json(res, 201)` / `HttpViews.noContent(res)` build the standard views |
| `HttpResponder` | Output port implemented by `ExpressResponderAdapter` |
| `MongooseRepository` | `findById`, `save`, plus `findOneBy`, `findManyBy`, `findPage(keyset, filter, page)`; always in the current transaction |
| `moduleRoutes`, `errorResponse` | OpenAPI helpers: shared `tags`/`auth` per module and error responses |
| `InputParser` | `parse(schema, raw)` → typed input or `ValidationError` (400) |
| `Entity`, `ValueObject` | Domain base classes |
| `Repository<T>`, `DataMapper` | Persistence abstractions implemented by `MongooseRepository` |
| `ApplicationError` + subclasses | `validation · not_found · conflict · unauthorized · forbidden` |
| `AppModule`, `ContractRegistry`, `RouteContract` | Module and OpenAPI registration contracts |

## One endpoint from start to end: `POST /patients`

Read it in this order. Each step is one file.

```ts
// 1. view/PatientRoutes.ts — the View: read the request, pick the use case, never decide anything
router.post('/', async (req, res) => {
  const data = InputParser.parse(PatientInputSchema, req.body); // 400 if invalid
  await this.presenters
    .createPatient(HttpViews.json(res, 201)) // the view answers 201 with JSON
    .present({ actor: ActorReader.from(res), data });
});

// 2. presenter/PatientPresenters.ts — the registry: which presenter, with which model
createPatient(view: View<PatientDto>) {
  return new CreatePatientPresenter(view, this.patientService);
}

// 3. presenter/CreatePatientPresenter.ts — the Presenter: DTO in, call the model, DTO out
export class CreatePatientPresenter extends Presenter<
  { actor: AuthenticatedActor; data: PatientInputDto },
  PatientDto,
  PatientService
> {
  protected async execute(input: { actor: AuthenticatedActor; data: PatientInputDto }) {
    const details = PatientViewModel.toDetails(input.data);
    const patient = await this.model.register(input.actor.professionalId, details);
    return PatientViewModel.toDto(patient, this.model.now);
  }
}

// 4. model/PatientService.ts — the Model: business rules inside one transaction
register(professionalId: string, details: PatientDetails): Promise<Patient> {
  return this.transactions.run(async () => {
    const patient = Patient.create(/* ... */);       // entity validates itself
    await this.assertDniIsFree(professionalId, patient.dni);
    await this.patients.save(patient);
    await this.audit.record({ professionalId, action: 'patient.created' /* ... */ });
    return patient;
  });
}

// 5. infrastructure/MongoosePatientRepository.ts — persistence (Adapter)
findByDni(professionalId: string, dni: string) {
  return this.findOneBy({ professionalId, dni });
}

// 6. contracts/patients.contracts.ts — the OpenAPI contract (drives codegen for the web)
route({
  method: 'post',
  path: '/patients',
  operationId: 'createPatient',
  summary: 'CU-04 Register a patient',
  request: { body: PatientInputSchema },
  responses: {
    201: { description: 'Patient registered', schema: PatientSchema },
    400: invalid,
    409: errorResponse('DNI already registered'),
  },
});
```

A new use case in an existing module is therefore: a model method, a presenter (only
`execute`), one method in `<Name>Presenters`, one route and one contract entry.

## Error handling

1. The Model throws `ApplicationError` subclasses.
2. The Presenter catches them and calls `view.renderError(...)`. The `HttpView` then answers with
   the mapped status and an `ErrorResponseDto`.
3. Validation errors thrown by views before `present()`, and unknown errors, reach
   `HttpErrorHandler`. It renders known errors the same way and turns everything else into a
   logged 500.

## Enforcement

See the rule table in ADR-0004 and the `overrides` in `biome.json`. Run `pnpm lint`.
