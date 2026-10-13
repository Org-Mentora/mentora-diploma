---
name: new-backend-module
description: Add a new API module or a new use case (CU) to an existing module in apps/api following the MVP Passive View architecture (model, presenter, passive view, zod contracts, Mongoose adapters) and OOP conventions. Use for any new endpoint, entity or backend use case.
---

# New backend module / use case (MVP)

Read first: `apps/api/CLAUDE.md`, `docs/guides/add-backend-module.md`. Copy patterns from
`apps/api/src/modules/health`.

## Checklist (in this order)

1. **Name things in English**, using the glossary when one exists. Module folder: plural
   kebab-case (`mentoring-sessions`). Classes: PascalCase.
2. **Model** (`modules/<m>/model/`)
   - Entity `extends Entity<Props>` with `static create()` enforcing invariants; behaviour as methods.
   - Value objects `extends ValueObject<Props>`.
   - `abstract class <X>Repository extends Repository<X>` with custom query signatures.
   - `<X>Service` receives abstractions in its constructor and throws `ApplicationError`
     subclasses (`ValidationError`, `NotFoundError`, `ConflictError`, ...).
3. **Infrastructure** (`modules/<m>/infrastructure/`)
   - Mongoose schema (`_id: { type: String, required: true }`, UUID ids).
   - `<X>Mapper implements DataMapper<X, XDocument>`.
   - `Mongoose<X>Repository extends MongooseRepository<X, XDocument>`.
4. **Contracts** (`modules/<m>/contracts/<m>.contracts.ts`)
   - zod schemas `.meta({ id: '<Name>Dto' })` for responses and `<Action><Name>RequestDto` for inputs.
   - `register<M>Contracts(registry)` with one `registerRoute` per endpoint.
     `operationId` camelCase (`listMentors`). Document error responses with `ErrorResponseSchema`.
5. **Presenter** (`modules/<m>/presenter/`)
   - One `<UseCase>Presenter extends Presenter<InputDto, OutputDto>` per use case.
     `execute()` calls the Model and maps to the DTO.
   - `<M>PresenterFactory` interface: one method per use case, taking `View<OutputDto>`.
6. **View** (`modules/<m>/view/`)
   - `<Name>HttpView extends HttpView<Dto>` (override `successStatus` = 201 for creates).
   - `<M>Routes`: per route, `new XHttpView(new ExpressResponderAdapter(res))`, then
     `InputParser.parse(Schema, req.body|params|query)`, then `factory.useCase(view).present(input)`.
7. **Composition root** `<M>Module implements AppModule, <M>PresenterFactory`, plus `index.ts`
   exporting the module and DTO types. Register it in `src/app/modules.ts`.
8. **Tests**: presenter unit test with `SpyView` (`test/support/fakes.ts`), HTTP test with
   supertest, and repository test with `mongodb-memory-server`.
9. Run `pnpm codegen` (root) and commit the regenerated contract files.
   Update the endpoint table in `docs/api/README.md`.
10. Run `pnpm lint && pnpm typecheck && pnpm test`. If Biome reports `[arch]`, move the code to
    the right layer. Do not disable the rule.
11. New library or pattern? Use the `new-adr` skill.
