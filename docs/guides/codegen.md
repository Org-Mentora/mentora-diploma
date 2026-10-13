# Code generation (OpenAPI → DTOs → RTK Query)

Decision: [ADR-0010](../adr/0010-frontend-codegen.md).

```bash
pnpm codegen         # regenerate everything (Turborepo pipeline)
pnpm codegen:check   # regenerate + fail if git sees a diff (CI)
```

| Step | Package | Command | Output |
| --- | --- | --- | --- |
| 1 | `@mentora/api` | `openapi:generate` (tsx, no DB needed) | `packages/contracts/openapi.json` |
| 2 | `@mentora/contracts` | `generate` (openapi-typescript `--root-types`) | `packages/contracts/src/dtos.generated.ts` |
| 3 | `@mentora/web` | `codegen` (`scripts/codegen.ts` → `generateEndpoints`) | `apps/web/src/model/api/generated/mentoraApi.ts` |

## How names are derived

| Backend | Generated |
| --- | --- |
| `.meta({ id: 'MentorDto' })` | `MentorDto` type (both outputs) |
| `operationId: 'listMentors'` (GET) | `useListMentorsQuery`, `useLazyListMentorsQuery` |
| `operationId: 'createMentor'` (POST) | `useCreateMentorMutation` |
| `tags: ['Mentors']` | RTK Query tag `Mentors` (`providesTags`/`invalidatesTags`) |

## Rules

- Commit generated files; never edit them (Biome ignores them).
- A nullable reference to a named DTO is `nullableRef(SomeDtoSchema)`, never `SomeDtoSchema.nullable()`
  ([ADR-0023](../adr/0023-openapi-3-1-nullable-refs.md)).
- Change the API contract → run `pnpm codegen` in the same commit.
- To customise caching (for example, invalidate tags after a mutation), use
  `mentoraApi.enhanceEndpoints({...})` in `src/model/api/`. Never edit the generated file.
