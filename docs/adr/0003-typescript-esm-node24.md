# ADR-0003: TypeScript strict, ESM and Node 24

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** Mentora team
- **Tags:** tooling
- **Supersedes:** —

## Context and problem statement

We need one language and module system across the monorepo, with a strict type system that
catches errors early and is friendly to code generation.

## Decision drivers

- Type safety end to end (zod contracts → OpenAPI → generated frontend types).
- Modern runtime features (native `fetch`, `--env-file`, `import.meta.dirname`).
- Tooling compatibility (codegen tools rely on the TypeScript compiler JS API).

## Considered options

1. TypeScript 6 (JS-based compiler), ESM, Node 24 LTS
2. TypeScript 7 (native Go compiler)
3. JavaScript with JSDoc types

## Decision outcome

Chosen option: **TypeScript 6.0 (strict), ESM everywhere, Node 24 LTS.**

- Shared presets live in `packages/tsconfig` (`base`, `node`, `react`). `strict`,
  `noUncheckedIndexedAccess`, `noImplicitOverride` and `verbatimModuleSyntax` are on.
- `moduleResolution: Bundler`: the API is bundled by tsup and the web by Vite; type-checking
  is `tsc --noEmit`.
- The API uses **Node subpath imports** (`#core/*`, `#infrastructure/*`, `#modules/*`) declared in
  `apps/api/package.json`. `#modules/<name>` resolves only to a module's `index.ts`, so deep imports
  into another module are impossible by construction.
- The web app uses the `@/*` alias (shadcn/ui convention).
- TypeScript 7 was not adopted yet because `@rtk-query/codegen-openapi` and `openapi-typescript`
  depend on the TypeScript 5/6 JS API. Revisit with a new ADR when they support it.

### Consequences

- 👍 Strong guarantees; aliases double as architecture boundaries.
- 👎 TypeScript 7's faster compiler is not used for now.

## Enforcement

`pnpm typecheck` in CI. Versions pinned in each `package.json`.

## References

- `packages/tsconfig/*.json`, `apps/api/package.json#imports`
