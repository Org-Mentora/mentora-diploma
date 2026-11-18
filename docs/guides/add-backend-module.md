# Add a backend module (MVP)

Example: a `mentors` module with the use case "register mentor". Copy the structure of
`apps/api/src/modules/health`. Agents can follow `.claude/skills/new-backend-module`.

## 1. Model (`model/`)

- `Mentor.ts`: `class Mentor extends Entity<MentorProps>` with a `static create(...)` that
  validates invariants (throw `ValidationError`/`ConflictError`) and behaviour methods.
- `MentorRepository.ts`: `abstract class MentorRepository extends Repository<Mentor>` plus
  custom queries (`abstract findByEmail(email): Promise<Mentor | null>`).
- `MentorService.ts`: orchestrates entities and repositories. Its constructor takes abstractions only.

No `express`, `mongoose`, `zod`, DTOs or `#infrastructure` imports (lint will fail).

## 2. Infrastructure (`infrastructure/`)

- `MentorSchema.ts`: Mongoose schema with `_id: { type: String }`, plus the model.
- `MentorMapper.ts`: `implements DataMapper<Mentor, MentorDocument>`.
- `MongooseMentorRepository.ts`: `extends MongooseRepository<Mentor, MentorDocument>`,
  receives the `TransactionContext` and implements the custom queries with the base helpers
  `findOneBy`, `findManyBy` and `findPage`, which always join the running transaction (ADR-0025).
  Write raw Mongoose (`this.model...`) only for counts or aggregations, with `.session(this.session)`.

## 3. Contracts (`contracts/mentor.contracts.ts`)

```ts
export const MentorSchema = z.object({ id: z.uuid(), name: z.string(), email: z.email() })
  .meta({ id: 'MentorDto' });
export const CreateMentorRequestSchema = z.object({ name: z.string().min(1), email: z.email() })
  .meta({ id: 'CreateMentorRequestDto' });

export function registerMentorContracts(registry: ContractRegistry): void {
  const route = moduleRoutes(registry, { tags: ['Mentors'], auth: true });
  route({
    method: 'post', path: '/mentors', operationId: 'createMentor',
    summary: 'Register a mentor',
    request: { body: CreateMentorRequestSchema },
    responses: {
      201: { description: 'Created', schema: MentorSchema },
      400: errorResponse('Invalid input'),
      409: errorResponse('Email already registered'),
    },
  });
}
```

## 4. Presenter (`presenter/`)

- `CreateMentorPresenter extends Presenter<CreateMentorRequestDto, MentorDto, MentorService>`: no
  constructor; `execute()` calls `this.model` and maps the entity to the DTO.
- `MentorPresenters` (`// Abstract Factory`): a class that receives the service(s) and has one
  method per use case: `createMentor(view: View<MentorDto>) { return new CreateMentorPresenter(view, this.mentorService); }`.

## 5. View (`view/`)

- `MentorRoutes`: per route, run `InputParser.parse(...)`, then
  `this.presenters.createMentor(HttpViews.json(res, 201)).present(input)`.
- Write an `XHttpView extends HttpView<Dto>` only when the view does something special
  (cookies, a status that depends on the data).

## 6. Composition root and registration

- `MentorModule implements AppModule` builds `new MentorRoutes(new MentorPresenters(service), guard)` and takes one
  `MentorModuleDependencies` object ([ADR-0024](../adr/0024-injectable-module-adapters.md)):
  shared collaborators (`guard`, `clock`, `transactions`, `context`) are required, Model ports
  are optional (`repository?: MentorRepository`), and it wires
  `new MentorService(deps.repository ?? new MongooseMentorRepository(deps.context), deps.transactions, deps.clock)`
  ([ADR-0025](../adr/0025-transactions-with-context.md)).
- `index.ts` exports `MentorModule`, `MentorModuleDependencies` and the DTO types.
- Add `new MentorModule({ guard, clock, transactions, context })` to `apps/api/src/app/modules.ts`.

## 7. Tests, codegen and docs

- `test/unit/<module>-presenter.test.ts` (SpyView), `test/integration/<module>.http.test.ts`
  (supertest), and repository tests with mongodb-memory-server. Add an in-memory repository to
  `test/support/inMemory.ts` and wire it in `test/integration/in-memory.http.test.ts`.
- `pnpm codegen`, then commit `openapi.json`, `dtos.generated.ts` and `mentoraApi.ts`.
- Add the endpoints to `docs/api/README.md`. Add an ADR if you introduced a new decision.
- `pnpm lint && pnpm typecheck && pnpm test`.
