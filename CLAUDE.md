# Mentora: agent guide

pnpm + Turborepo monorepo. `apps/api` is an Express 5 API (OOP, **MVP Passive View**, MongoDB).
`apps/web` is a Vite + React 19 SPA (**MVVM**, RTK Query, Tailwind v4 + shadcn/ui).
`packages/contracts` holds the generated OpenAPI spec and DTO types.
App-specific rules are in `apps/api/CLAUDE.md` and `apps/web/CLAUDE.md`.

## Commands

```bash
pnpm dev | pnpm build | pnpm typecheck | pnpm test
pnpm lint           # Biome: format + lint + ARCHITECTURE rules + comment rule. Must pass.
pnpm lint:fix
pnpm codegen        # API zod contracts → openapi.json → DTO types → RTK Query hooks
pnpm docs:classes   # regenerate docs/architecture/class-diagram.md after changing classes
pnpm smoke          # end-to-end smoke test against BASE_URL (default http://localhost:8080)
pnpm seed           # demo account + test data against `pnpm dev` (compose runs it on `up`)
pnpm db:backup | pnpm db:restore <file>   # local MongoDB dump / restore into backups/
docker compose up --build            # full stack + demo data: web :8080, api :3000 (/api/docs)
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
8. Comments only name the design pattern above the declaration that applies it: `// Adapter`
   (ADR-0035, `pnpm lint:comments`). Everything else goes to ADRs, guides or test names.

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
| Process | [0035](docs/adr/0035-comments-name-design-patterns.md) | Comments only name the design pattern (`// Adapter`); checked by `pnpm lint:comments` | Accepted |
| Tooling | [0002](docs/adr/0002-monorepo-pnpm-turborepo.md) | pnpm workspaces + Turborepo; exact versions; opt-in dependency build scripts | Accepted |
| Tooling | [0003](docs/adr/0003-typescript-esm-node24.md) | TS 6 strict, ESM, Node 24; API subpath imports `#core` `#infrastructure` `#modules`; web `@/` | Accepted |
| Tooling | [0013](docs/adr/0013-biome-architecture-linting.md) | Biome 2: per-layer `noRestrictedImports` overrides, GritQL plugins, Lefthook | Accepted |
| Backend | [0004](docs/adr/0004-backend-mvp-passive-view.md) | MVP Passive View per module: model / presenter / view / contracts / infrastructure | Accepted |
| Backend | [0005](docs/adr/0005-backend-oop-conventions.md) | Classes, abstract classes owned by the Model, constructor injection, `ApplicationError` | Accepted |
| Backend | [0024](docs/adr/0024-injectable-module-adapters.md) | `<Name>ModuleDependencies`: Model ports optional (`deps.x ?? new MongooseX()`); Singletons/clock from `modules.ts` | Accepted |
| Backend | [0018](docs/adr/0018-authentication-session-cookie.md) | JWT (jose) in httpOnly cookie `mentora_session`; scrypt; `AuthGuard` 401/403 `SUBSCRIPTION_INACTIVE` | Accepted |
| Backend | [0041](docs/adr/0041-pluggable-token-signing-algorithm.md) | JWT signing algorithm is a `TokenSigningAlgorithm` Strategy injected into `JoseTokenService` (HS256 today) | Accepted |
| Backend | [0034](docs/adr/0034-session-credentials-version.md) | Session token carries a credentials version; a password change stops other sessions from renewing | Accepted |
| Backend | [0019](docs/adr/0019-per-professional-data-ownership.md) | Every aggregate scoped by `professionalId`; foreign data → 404; DNI unique per professional | Accepted |
| Backend | [0020](docs/adr/0020-clinical-record-aggregate.md) | `ClinicalRecord` aggregate embeds append-only consultations (diagnosis/medication as VOs) | Accepted |
| Backend | [0022](docs/adr/0022-cross-module-collaboration.md) | Modules talk via query services in `index.ts` + consumer-owned abstractions + adapters | Accepted |
| Backend | [0008](docs/adr/0008-mongodb-mongoose.md) | MongoDB 8 + Mongoose only in infrastructure; UUID string `_id`; DataMapper | Accepted |
| Backend | [0025](docs/adr/0025-transactions-with-context.md) | Write use cases in `TransactionManager.run`; `TransactionContext` (AsyncLocalStorage) gives repos the session; Mongo replica set | Accepted |
| Backend | [0026](docs/adr/0026-scheduled-jobs.md) | `AppModule.scheduledJobs()` run by the in-process `IntervalJobScheduler`; idempotent, `SCHEDULER_ENABLED` | Accepted |
| Backend | [0027](docs/adr/0027-email-smtp-mailpit.md) | Email via `MailTransport` (nodemailer SMTP); Mailpit inbox at :8025 locally | Accepted |
| Backend | [0028](docs/adr/0028-password-recovery-codes.md) | CU-02: 6-digit scrypt-hashed codes, 15 min, 5 attempts, single use, same answer for unknown emails | Accepted |
| Backend | [0029](docs/adr/0029-subscriptions-and-payments.md) | `subscriptions` module owns plans/cards/payments; `PaymentGateway` port + simulated gateway; charges outside transactions; `/auth/me` refreshes the cookie | Accepted |
| Backend | [0030](docs/adr/0030-whatsapp-notifications.md) | `notifications` module: `NotificationCenter` + delivery log; local outbox or WhatsApp Cloud API | Accepted |
| Backend | [0031](docs/adr/0031-video-call-providers.md) | CU-15 `MeetingLinkProvider`: Jitsi by default, Google Meet by config | Accepted |
| API/Web | [0032](docs/adr/0032-logo-storage-and-client-pdf.md) | Logo as PNG/JPEG in `professional_logos`; prescriptions printed or rendered with jsPDF in the browser | Accepted |
| Backend | [0033](docs/adr/0033-cross-module-commands.md) | Cross-module command services called inside the caller's transaction | Accepted |
| Backend | [0040](docs/adr/0040-concurrency-and-audit-hardening.md) | Agenda lock per professional, rate limits in Mongo (`MongoRateLimitStore`), append-only clinical record access log, email fallback in `NotificationCenter.send` | Accepted |
| Patterns | [0006](docs/adr/0006-singleton-pattern.md) | Singleton: AppConfig, Logger, MongoConnection, OpenApiRegistry, AppStore | Accepted |
| Patterns | [0042](docs/adr/0042-dependency-inversion-for-platform-services.md) | DIP for platform services: API `IdGenerator` + `DateFormatter`; web `UserFeedback` + `BrowserActions` via `PlatformContext` | Accepted |
| Patterns | [0007](docs/adr/0007-adapter-pattern.md) | Adapter at every technology boundary (Mongoose, pino, Express, zod-to-openapi, DTO→UI) | Accepted |
| API | [0009](docs/adr/0009-code-first-openapi.md) | zod contracts with `.meta({id})` → OpenAPI → Swagger UI at `/api/docs` (~~OpenAPI 3.0.3~~ → 0023) | Amended |
| API | [0023](docs/adr/0023-openapi-3-1-nullable-refs.md) | OpenAPI **3.1** output; nullable DTO refs via `nullableRef(Schema)`, never `.nullable()` | Accepted |
| API/Web | [0010](docs/adr/0010-frontend-codegen.md) | `pnpm codegen` → `@mentora/contracts` DTOs + RTK Query hooks; committed and CI-checked | Accepted |
| Frontend | [0011](docs/adr/0011-frontend-mvvm.md) | MVVM: View → `useXxxViewModel` → model (generated API + adapters) | Accepted |
| Frontend | [0021](docs/adr/0021-forms-in-viewmodels.md) | Forms: react-hook-form + zod schemas in `model/domain`, `useForm` owned by the ViewModel | Accepted |
| Frontend | [0012](docs/adr/0012-tailwind-shadcn.md) | Tailwind v4 CSS-first + shadcn/ui in `src/shared/ui` | Accepted |
| Ops | [0014](docs/adr/0014-containerization.md) | Multi-stage Dockerfiles (dev/build/runtime), Compose + dev watch overlay (~~root nginx :80~~ → 0038) | Amended |
| Ops | [0036](docs/adr/0036-ci-cd-quality-gates.md) | CI gates (lint, types, tests, build, codegen + class diagram, audit, e2e smoke + restore drill), CodeQL, GHCR release with SBOM; actions pinned by SHA | Accepted |
| Ops | [0037](docs/adr/0037-operational-readiness.md) | `/health/live` + `/health/ready`, auth rate limits (429, ~~in memory~~ → 0040), `X-Request-Id`, graceful shutdown, `MongoJobLock`, `MigrationLog` | Amended |
| Ops | [0043](docs/adr/0043-demo-data-seed.md) | Local compose reads `.env`; one-shot `seed` service loads demo data through the public API (`demo@mentora.test`); `pnpm seed` | Accepted |
| Ops | [0038](docs/adr/0038-production-images-and-deployment.md) | Non-root images on GHCR, nginx-unprivileged :8080, `docker-compose.prod.yml` with Mongo auth, read-only containers | Accepted |
| Ops | [0039](docs/adr/0039-database-backup-strategy.md) | Daily `mongodump` sidecar, sha256, 14-day retention, offsite copy, restore drill in CI; RPO 24 h / RTO 1 h | Accepted |
| Quality | [0015](docs/adr/0015-testing-strategy.md) | Vitest everywhere: SpyView presenters, supertest, in-memory Mongo, mocked ViewModels | Accepted |

Setup and demo login: `SETUP.md`. Product scope (all 18 CUs + external services): `docs/product/mvp-scope.md`. Local walkthrough: `docs/guides/try-locally.md`. Domain names ES→EN: `docs/architecture/glossary.md`.
Operations (deploy, config, backups, runbook, CI/CD): `docs/operations/`. Diagrams: `docs/architecture/class-diagram.md`, `docs/architecture/sequence-diagrams.md`.
More: `docs/README.md` (architecture overviews, guides, API reference).
