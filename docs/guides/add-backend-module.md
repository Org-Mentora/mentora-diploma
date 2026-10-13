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
- `MongooseMentorRepository.ts`: `extends MongooseRepository<Mentor, MentorDocument>`
  and implements the custom queries.

## 3. Contracts (`contracts/mentor.contracts.ts`)

```ts
export const MentorSchema = z.object({ id: z.uuid(), name: z.string(), email: z.email() })
  .meta({ id: 'MentorDto' });
export const CreateMentorRequestSchema = z.object({ name: z.string().min(1), email: z.email() })
  .meta({ id: 'CreateMentorRequestDto' });

export function registerMentorContracts(registry: ContractRegistry): void {
  registry.registerRoute({
    method: 'post', path: '/mentors', operationId: 'createMentor',
    summary: 'Register a mentor', tags: ['Mentors'],
    request: { body: CreateMentorRequestSchema },
    responses: {
      201: { description: 'Created', schema: MentorSchema },
      400: { description: 'Invalid input', schema: ErrorResponseSchema },
      409: { description: 'Email already registered', schema: ErrorResponseSchema },
    },
  });
}
```

## 4. Presenter (`presenter/`)

- `CreateMentorPresenter extends Presenter<CreateMentorRequestDto, MentorDto>`: `execute()` calls
  the service and maps the entity to the DTO.
- `MentorPresenterFactory`: an interface with one method per use case, each taking a `View<...>`.

## 5. View (`view/`)

- `MentorHttpView extends HttpView<MentorDto>`, and `CreateMentorHttpView` with
  `protected override readonly successStatus = 201`.
- `MentorRoutes`: per route, build the view, run `InputParser.parse(...)`, then
  `factory.xxx(view).present(input)`.

## 6. Composition root and registration

- `MentorModule implements AppModule, MentorPresenterFactory` wires
  `new MentorService(new MongooseMentorRepository(), ...)`.
- `index.ts` exports `MentorModule` and the DTO types.
- Add `new MentorModule()` to `apps/api/src/app/modules.ts`.

## 7. Tests, codegen and docs

- `test/unit/<module>-presenter.test.ts` (SpyView), `test/integration/<module>.http.test.ts`
  (supertest), and repository tests with mongodb-memory-server.
- `pnpm codegen`, then commit `openapi.json`, `dtos.generated.ts` and `mentoraApi.ts`.
- Add the endpoints to `docs/api/README.md`. Add an ADR if you introduced a new decision.
- `pnpm lint && pnpm typecheck && pnpm test`.
