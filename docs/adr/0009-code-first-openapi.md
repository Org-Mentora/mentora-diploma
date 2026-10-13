# ADR-0009: Code-first OpenAPI with zod and Swagger UI

- **Status:** Accepted — output version amended by [ADR-0023](0023-openapi-3-1-nullable-refs.md)
- **Date:** 2026-10-13
- **Deciders:** Mentora team
- **Tags:** api
- **Supersedes:** —

## Context and problem statement

Every endpoint must be documented in Swagger, and that documentation must never drift from what
the code actually accepts and returns. It is also the input of the frontend code generation
([ADR-0010](0010-frontend-codegen.md)).

## Decision drivers

- One source of truth for validation, types and documentation.
- No decorators or framework lock-in, which keeps MVP views passive.
- OpenAPI output compatible with the frontend generators.

## Considered options

1. zod schemas + `@asteasolutions/zod-to-openapi` (code-first)
2. tsoa decorators on controllers
3. Hand-written `openapi.yaml` (design-first)

## Decision outcome

Chosen option: **zod schemas as contracts, converted to OpenAPI 3.0.3.**

- Each module has `contracts/<name>.contracts.ts` with:
  - zod DTO schemas, each with `.meta({ id: 'XxxDto' })`. The id becomes the OpenAPI component
    **and** the generated TypeScript type name;
  - `registerXxxContracts(registry: ContractRegistry)`, which declares every route
    (`method`, `path`, `operationId`, `summary`, `tags`, `request`, `responses`).
- The same schemas validate input in views (`InputParser.parse(schema, req.body)`) and type the
  presenters' output (`z.infer`).
- `operationId` is camelCase (`getHealth`, `createMentor`). It determines the generated hook name
  (`useGetHealthQuery`, `useCreateMentorMutation`).
- Errors use the shared `ErrorResponseDto` (`#core/contracts/ErrorResponse`).
- Served at runtime: Swagger UI at **`/api/docs`**, raw JSON at **`/api/openapi.json`**.
- Committed copy: `packages/contracts/openapi.json` (written by `pnpm codegen`).

### Consequences

- 👍 Documentation cannot drift: it is built from the same schemas that validate requests.
- 👎 Route contracts are declared separately from Express routes; integration tests check that
  they match.

## Enforcement

`pnpm codegen:check` in CI fails if the committed spec or generated client is stale.

## References

- `apps/api/src/infrastructure/openapi/OpenApiRegistry.ts`, `apps/api/src/modules/health/contracts`
