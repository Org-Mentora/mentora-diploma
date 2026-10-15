# Mentora: agent guide

pnpm + Turborepo monorepo. `apps/api` is an Express 5 API (OOP, **MVP Passive View**, MongoDB).
`apps/web` is a Vite + React 19 SPA (**MVVM**, RTK Query, Tailwind v4 + shadcn/ui).
`packages/contracts` holds the generated OpenAPI spec and DTO types.
App-specific rules are in `apps/api/CLAUDE.md` and `apps/web/CLAUDE.md`.

## Commands

```bash
pnpm dev | pnpm build | pnpm typecheck | pnpm test
pnpm lint           # Biome: format + lint + ARCHITECTURE rules. Must pass.
pnpm lint:fix
pnpm codegen        # API zod contracts → openapi.json → DTO types → RTK Query hooks
docker compose up --build            # full stack: web :8080, api :3000 (/api/docs)
docker compose up -d mongo           # only MongoDB for `pnpm dev`
```

## Non-negotiable rules

1. Respect the layer boundaries (ADR-0004 API, ADR-0011 web). Biome reports violations as
   `[arch]…`. Fix the design; never silence the rule.
2. Never edit generated files: `packages/contracts/openapi.json`, `*.generated.ts`,
   `apps/web/src/model/api/generated/**`. Change the zod contract, then run `pnpm codegen`.
3. No hand-written `fetch` or DTO types in the web. Use the generated hooks in ViewModels only.
4. Singletons (`getInstance()`) are only called in composition roots and bootstrap code.
   Everything else receives dependencies through its constructor (ADR-0006).
5. Third-party libraries are reached through adapters in `infrastructure/` or `model/` (ADR-0007).
6. English everywhere. Conventional Commits (`feat(api): …`), enforced by Lefthook.
7. A new library, layer, pattern or convention needs an ADR (skill: `new-adr`).
   Update this index in the same PR.

## Skills (recipes)

- `.claude/skills/new-backend-module`: add an API module or use case (MVP).
- `.claude/skills/new-frontend-feature`: add a screen (MVVM).
- `.claude/skills/new-adr`: record or supersede a decision.

## ADR index

Read the full ADR in `docs/adr/` **before** changing the area it covers. Accepted ADRs are
immutable: superseded rows stay here, struck through, to keep the decision history.

| Area | ADR | Decision (one line) | Status |
| --- | --- | --- | --- |
| Process | [0001](docs/adr/0001-record-architecture-decisions.md) | Decisions recorded as MADR ADRs. Changes are made by superseding ADRs, never by editing them | Accepted |
| Process | [0016](docs/adr/0016-english-only.md) | English for code, docs and commits. Domain glossary maps the Spanish use cases | Accepted |
| Process | [0017](docs/adr/0017-agent-context.md) | Short CLAUDE.md with an ADR index, nested per-app CLAUDE.md, skills for recipes | Accepted |
| Tooling | [0002](docs/adr/0002-monorepo-pnpm-turborepo.md) | pnpm workspaces + Turborepo; exact versions; opt-in dependency build scripts | Accepted |
| Tooling | [0003](docs/adr/0003-typescript-esm-node24.md) | TS 6 strict, ESM, Node 24; API subpath imports `#core` `#infrastructure` `#modules`; web `@/` | Accepted |
| Tooling | [0013](docs/adr/0013-biome-architecture-linting.md) | Biome 2: per-layer `noRestrictedImports` overrides, GritQL plugins, Lefthook | Accepted |
| Backend | [0004](docs/adr/0004-backend-mvp-passive-view.md) | MVP Passive View per module: model / presenter / view / contracts / infrastructure | Accepted |
| Backend | [0005](docs/adr/0005-backend-oop-conventions.md) | Classes, abstract classes owned by the Model, constructor injection, `ApplicationError` | Accepted |
| Backend | [0024](docs/adr/0024-injectable-module-adapters.md) | `<Name>ModuleDependencies`: Model ports optional (`deps.x ?? new MongooseX()`); Singletons/clock from `modules.ts` | Accepted |
| Backend | [0018](docs/adr/0018-authentication-session-cookie.md) | JWT (jose) in httpOnly cookie `mentora_session`; scrypt; `AuthGuard` 401/403 `SUBSCRIPTION_INACTIVE` | Accepted |
| Backend | [0019](docs/adr/0019-per-professional-data-ownership.md) | Every aggregate scoped by `professionalId`; foreign data → 404; DNI unique per professional | Accepted |
| Backend | [0020](docs/adr/0020-clinical-record-aggregate.md) | `ClinicalRecord` aggregate embeds append-only consultations (diagnosis/medication as VOs) | Accepted |
| Backend | [0022](docs/adr/0022-cross-module-collaboration.md) | Modules talk via query services in `index.ts` + consumer-owned abstractions + adapters | Accepted |
| Backend | [0008](docs/adr/0008-mongodb-mongoose.md) | MongoDB 8 + Mongoose only in infrastructure; UUID string `_id`; DataMapper | Accepted |
| Patterns | [0006](docs/adr/0006-singleton-pattern.md) | Singleton: AppConfig, Logger, MongoConnection, OpenApiRegistry, AppStore | Accepted |
| Patterns | [0007](docs/adr/0007-adapter-pattern.md) | Adapter at every technology boundary (Mongoose, pino, Express, zod-to-openapi, DTO→UI) | Accepted |
| API | [0009](docs/adr/0009-code-first-openapi.md) | zod contracts with `.meta({id})` → OpenAPI → Swagger UI at `/api/docs` (~~OpenAPI 3.0.3~~ → 0023) | Amended |
| API | [0023](docs/adr/0023-openapi-3-1-nullable-refs.md) | OpenAPI **3.1** output; nullable DTO refs via `nullableRef(Schema)`, never `.nullable()` | Accepted |
| API/Web | [0010](docs/adr/0010-frontend-codegen.md) | `pnpm codegen` → `@mentora/contracts` DTOs + RTK Query hooks; committed and CI-checked | Accepted |
| Frontend | [0011](docs/adr/0011-frontend-mvvm.md) | MVVM: View → `useXxxViewModel` → model (generated API + adapters) | Accepted |
| Frontend | [0021](docs/adr/0021-forms-in-viewmodels.md) | Forms: react-hook-form + zod schemas in `model/domain`, `useForm` owned by the ViewModel | Accepted |
| Frontend | [0012](docs/adr/0012-tailwind-shadcn.md) | Tailwind v4 CSS-first + shadcn/ui in `src/shared/ui` | Accepted |
| Ops | [0014](docs/adr/0014-containerization.md) | Multi-stage Dockerfiles (dev/build/runtime), Compose + dev watch overlay | Accepted |
| Quality | [0015](docs/adr/0015-testing-strategy.md) | Vitest everywhere: SpyView presenters, supertest, in-memory Mongo, mocked ViewModels | Accepted |

Product scope (which CUs exist): `docs/product/mvp-scope.md`. Domain names ES→EN: `docs/architecture/glossary.md`.
More: `docs/README.md` (architecture overviews, guides, API reference).
