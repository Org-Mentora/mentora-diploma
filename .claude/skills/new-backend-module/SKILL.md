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
   - Write use cases run inside `this.transactions.run(async () => …)` (`TransactionManager`,
     ADR-0025). Notifications and other side effects go after `run` resolves.
3. **Infrastructure** (`modules/<m>/infrastructure/`)
   - Mongoose schema (`_id: { type: String, required: true }`, UUID ids).
   - `<X>Mapper implements DataMapper<X, XDocument>`.
   - `Mongoose<X>Repository extends MongooseRepository<X, XDocument>`; its constructor takes the
     `TransactionContext` and passes it to `super`. Custom queries use `findOneBy(filter)`,
     `findManyBy(filter, { sort, limit })` and `findPage(keyset, filter, page)`, which join the
     running transaction (ADR-0025). Raw `this.model` calls (counts, aggregations) add `.session(this.session)`.
4. **Contracts** (`modules/<m>/contracts/<m>.contracts.ts`)
   - zod schemas `.meta({ id: '<Name>Dto' })` for responses and `<Action><Name>RequestDto` for inputs.
   - `register<M>Contracts(registry)`: `const route = moduleRoutes(registry, { tags, auth: true })`, then one
     `route({...})` per endpoint. `operationId` camelCase (`listMentors`). Errors: `errorResponse('...')`.
5. **Presenter** (`modules/<m>/presenter/`)
   - One `<UseCase>Presenter extends Presenter<InputDto, OutputDto, <X>Service>` per use case, with no
     constructor. `execute()` calls `this.model` and maps to the DTO (ADR-0049).
   - `<M>Presenters` class (`// Abstract Factory`): receives the services, one method per use case
     returning `new <UseCase>Presenter(view, this.<service>)`.
6. **View** (`modules/<m>/view/`)
   - `<M>Routes`: per route, `InputParser.parse(Schema, req.body|params|query)`, then
     `this.presenters.useCase(HttpViews.json(res, 201)).present(input)` (`HttpViews.noContent(res)` for 204).
   - A custom `<Name>HttpView extends HttpView<Dto>` only for special rendering (cookies, data-driven status).
7. **Composition root** `<M>Module implements AppModule` (router: `new <M>Routes(new <M>Presenters(service), guard)`), plus `index.ts`
   exporting the module, its `<M>ModuleDependencies` and DTO types. Model ports are optional
   dependencies defaulting to the Mongoose adapter (`deps.repository ?? new Mongoose<X>Repository(deps.context)`);
   Singletons and the clock come from `src/app/modules.ts` (ADR-0024). Register it there.
8. **Tests**: presenter unit test with `SpyView` (`test/support/fakes.ts`), HTTP test with
   supertest, repository test with `mongodb-memory-server`, and an in-memory repository in
   `test/support/inMemory.ts` wired into `test/integration/in-memory.http.test.ts`.
9. Run `pnpm codegen` (root) and commit the regenerated contract files.
   Update the endpoint table in `docs/api/README.md`.
10. Run `pnpm lint && pnpm typecheck && pnpm test`. If Biome reports `[arch]`, move the code to
    the right layer. Do not disable the rule.
11. New library or pattern? Use the `new-adr` skill.
