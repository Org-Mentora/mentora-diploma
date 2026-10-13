# ADR-0023: Emit OpenAPI 3.1 and declare nullable references explicitly

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** Mentora team
- **Tags:** api, frontend
- **Supersedes:** — (amends the "OpenAPI 3.0.3" detail of [ADR-0009](0009-code-first-openapi.md))

## Context and problem statement

The MVP contracts reference named DTOs that may be null, such as `diagnosis: AssignedDiagnosisDto | null`
and `familyContact: FamilyContactDto | null`. With OpenAPI 3.0 output, two problems appeared:

1. When the generator met `Schema.nullable()` before a non-null usage, it registered the nullable
   variant as the component itself. Every reference then became nullable.
2. With `z.union([Schema, z.null()])`, 3.0 renders the null branch as `{ nullable: true }`,
   which both frontend generators typed as `unknown`/`any`.

## Decision drivers

- Exact generated types (`X | null`) in `@mentora/contracts` and the RTK Query hooks.
- Output that does not depend on the order in which contracts are registered.

## Considered options

1. OpenAPI 3.1 (`anyOf: [{ $ref }, { type: 'null' }]`) + an explicit `nullableRef()` helper
2. Stay on 3.0 and post-process the document into `allOf + nullable`
3. Avoid nullable references in contracts

## Decision outcome

Chosen option: **OpenAPI 3.1 + `nullableRef()`.**

- `OpenApiRegistry` uses `OpenApiGeneratorV31` with `openapi: '3.1.0'`.
- In contracts, write `nullableRef(SomeDtoSchema)` (from `#core/contracts/nullableRef`) instead
  of `SomeDtoSchema.nullable()` whenever the schema has a `.meta({ id })`.
  `.nullable()` stays fine for primitives.
- Both generators handle 3.1 correctly (verified with `pnpm codegen` and `tsc`). Swagger UI 5
  renders 3.1.

### Consequences

- 👍 Correct `X | null` types; order-independent components.
- 👎 One convention to remember. It is documented in the contracts guide and in the helper's JSDoc.

## Enforcement

`pnpm codegen:check` plus `pnpm typecheck`. A wrong nullable shows up as `unknown` and breaks
the frontend typecheck.

## References

- `apps/api/src/core/contracts/nullableRef.ts`, `apps/api/src/infrastructure/openapi/OpenApiRegistry.ts`
