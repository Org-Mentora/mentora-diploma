# Mentora: project overview

Mentora is a practice-management platform for mental-health professionals. It covers patients,
clinical records, agenda, prescriptions, WhatsApp notifications, virtual consultations and a paid
subscription. This page summarizes what was built and where to look in the code. Each claim links
to the file or ADR that proves it.

| Fact | Value |
| --- | --- |
| Use cases of the specification | **18 / 18** implemented ([scope](docs/product/mvp-scope.md)) |
| API modules | 9 (`apps/api/src/modules/*`) |
| Web features | 10 (`apps/web/src/features/*`) |
| Architecture decisions | 43 ADRs ([index](docs/adr/README.md)) |
| Automated tests | 207 (API 153, web 54), plus an end-to-end smoke test of the production images |
| Classes in the generated class diagram | 261 ([class diagram](docs/architecture/class-diagram.md)) |

---

## 1. Main things done

### Product (all use cases)

| Area | Use cases | Where |
| --- | --- | --- |
| Access | Log in, password recovery by emailed code, registration with a free trial, change password, profile and logo | `apps/api/src/modules/auth`, `apps/web/src/features/auth`, `features/settings` |
| Patients | Register, search, modify, discharge or reactivate. Automatic inactivation after 3 months without activity | `modules/patients`, job `patients.inactivate-dormant` |
| Clinical record | View the record, register consultations with diagnosis and medication from the DSM-5 catalog, diagnosis history, access log | `modules/clinical-records`, `modules/diagnosis-catalog` |
| Agenda | Create, reschedule and cancel appointments; no double booking; reminders | `modules/appointments`, job `appointments.send-reminders` |
| Prescriptions | Printable prescription and PDF with the professional's letterhead and logo | `apps/web/src/model/domain/prescriptions` |
| Notifications | WhatsApp (local outbox or Cloud API) with email fallback and a delivery log | `modules/notifications` |
| Virtual consultation | Meeting link (Jitsi or Google Meet) sent to the patient | `modules/virtual-consultations` |
| Subscription | Plans, card payments through a gateway, manual payments, automatic renewal, access cut-off | `modules/subscriptions`, job `subscriptions.process-renewals` |

### Engineering

- **Contract-first API:** zod contracts generate OpenAPI 3.1, which generates the DTO types and
  the RTK Query hooks the web uses (`pnpm codegen`, [ADR-0009](docs/adr/0009-code-first-openapi.md),
  [ADR-0010](docs/adr/0010-frontend-codegen.md)). The web contains no hand-written `fetch` and no
  hand-written DTOs.
- **Data consistency:**
  - MongoDB replica set with multi-document transactions ([ADR-0025](docs/adr/0025-transactions-with-context.md)).
  - A per-professional agenda lock against double booking.
  - Idempotency keys on payments.
  - A distributed job lock and a migration log ([ADR-0037](docs/adr/0037-operational-readiness.md), [ADR-0040](docs/adr/0040-concurrency-and-audit-hardening.md)).
- **Multi-tenancy by ownership:** every query is scoped by `professionalId`, and other
  professionals' data answers 404 ([ADR-0019](docs/adr/0019-per-professional-data-ownership.md)).
- **Security:**
  - Session cookie with httpOnly, SameSite and Secure set; JWT signed with an injected algorithm.
  - scrypt password hashing and a password policy.
  - Rate limits shared by all instances, single-use recovery codes, log redaction.
  - Append-only access log for clinical records.
  - Details in [ADR-0018](docs/adr/0018-authentication-session-cookie.md), [ADR-0028](docs/adr/0028-password-recovery-codes.md), [ADR-0034](docs/adr/0034-session-credentials-version.md), [ADR-0041](docs/adr/0041-pluggable-token-signing-algorithm.md) and [SECURITY.md](SECURITY.md).
- **Architecture enforced by tooling:**
  - Biome reports any import that crosses a layer as `[arch]` ([ADR-0013](docs/adr/0013-biome-architecture-linting.md)).
  - Biome also rejects `crypto` in the API model and `sonner` in web views and ViewModels ([ADR-0042](docs/adr/0042-dependency-inversion-for-platform-services.md)).
  - GritQL plugins in `tools/biome/` check Singleton constructors and forbid `fetch` outside the model.
  - A comment checker allows only design-pattern names ([ADR-0035](docs/adr/0035-comments-name-design-patterns.md)).
  - The class diagram is generated from the code and checked in CI.
- **Operations:**
  - Multi-stage, non-root Docker images; production compose with MongoDB authentication and read-only containers ([ADR-0014](docs/adr/0014-containerization.md), [ADR-0038](docs/adr/0038-production-images-and-deployment.md)).
  - Health probes (`/health/live`, `/health/ready`) and graceful shutdown ([ADR-0037](docs/adr/0037-operational-readiness.md)).
  - Daily backups with checksums and a restore drill in CI ([ADR-0039](docs/adr/0039-database-backup-strategy.md)).
- **CI/CD:**
  - CI runs lint, typecheck, tests, build, codegen and diagram drift checks, dependency audit, smoke test and restore drill.
  - CodeQL scans the code; release images are published to GHCR with an SBOM.
  - Actions are pinned by SHA ([ADR-0036](docs/adr/0036-ci-cd-quality-gates.md), `.github/workflows/`).

---

## 2. Architecture patterns per stack

### Repository as a whole

| Pattern | What it means here | Reference |
| --- | --- | --- |
| Monorepo | pnpm workspaces + Turborepo; API, web and the shared contracts in one repository | [ADR-0002](docs/adr/0002-monorepo-pnpm-turborepo.md), `turbo.json` |
| Contract-first integration | The generated `packages/contracts` package is the only coupling between API and web | `packages/contracts`, [docs/guides/codegen.md](docs/guides/codegen.md) |
| Architecture Decision Records | Every library, layer or convention has a MADR record; changes supersede, never edit | [ADR-0001](docs/adr/0001-record-architecture-decisions.md), `docs/adr/` |

### Backend (`apps/api`): Express 5, TypeScript, MongoDB

| Pattern | What it means here | Reference |
| --- | --- | --- |
| **MVP Passive View** | One Presenter per use case. Each Presenter calls the Model and gives the View a ready view model. Views only serialize. | [ADR-0004](docs/adr/0004-backend-mvp-passive-view.md), [backend-mvp.md](docs/architecture/backend-mvp.md), `src/core/presenter/Presenter.ts`, `src/core/view/HttpView.ts` |
| **Modular monolith** | Nine business modules with the same layout. Modules talk only through `index.ts` query and command services. | [ADR-0022](docs/adr/0022-cross-module-collaboration.md), [ADR-0033](docs/adr/0033-cross-module-commands.md), `src/modules/*/index.ts` |
| **Layered + Ports & Adapters** | `model` (pure TypeScript, owns the abstractions) ← `presenter` ← `view`. Adapters to Mongoose, SMTP, WhatsApp, Jitsi or Meet, the payment gateway and jose live in `infrastructure/`. | [ADR-0007](docs/adr/0007-adapter-pattern.md), `apps/api/CLAUDE.md`, `biome.json` |
| **DDD tactical patterns** | Entities, Aggregate Roots, Value Objects, Repositories, domain services; the clinical record is an aggregate with append-only consultations | [ADR-0005](docs/adr/0005-backend-oop-conventions.md), [ADR-0020](docs/adr/0020-clinical-record-aggregate.md), `src/core/model/` |
| **Unit of Work** | `TransactionManager.run`. The session travels in `AsyncLocalStorage` (`TransactionContext`). | [ADR-0025](docs/adr/0025-transactions-with-context.md), `src/infrastructure/database/MongoTransactionManager.ts` |
| **Composition Root + constructor DI** | Objects are created only in `main.ts`, `Application`, `createModules` and each `<Name>Module` | [ADR-0006](docs/adr/0006-singleton-pattern.md), [ADR-0024](docs/adr/0024-injectable-module-adapters.md), `src/app/modules.ts` |
| **Code-first OpenAPI** | zod contracts with `.meta({ id })` become OpenAPI 3.1 and Swagger UI at `/api/docs` | [ADR-0009](docs/adr/0009-code-first-openapi.md), [ADR-0023](docs/adr/0023-openapi-3-1-nullable-refs.md), `src/modules/*/contracts/` |
| **In-process scheduled jobs** | Idempotent jobs, one transaction per item, guarded by a distributed lock | [ADR-0026](docs/adr/0026-scheduled-jobs.md), `src/infrastructure/scheduling/` |

### Frontend (`apps/web`): React 19, Vite, RTK Query, Tailwind + shadcn/ui

| Pattern | What it means here | Reference |
| --- | --- | --- |
| **MVVM** | The View (JSX only) calls one `use<Name>ViewModel` hook. The hook calls the Model: generated hooks plus DTO → UI adapters. | [ADR-0011](docs/adr/0011-frontend-mvvm.md), [frontend-mvvm.md](docs/architecture/frontend-mvvm.md) |
| **Feature slices** | `features/<f>/{view,viewmodel,index.ts}`. Other features import only from `index.ts`. | `apps/web/CLAUDE.md`, `biome.json` |
| **Generated API client as the Model** | RTK Query hooks generated from OpenAPI. The cache is the client state, with session-aware re-validation. | [ADR-0010](docs/adr/0010-frontend-codegen.md), `src/model/api/baseApi.ts` |
| **Forms owned by the ViewModel** | zod schema in `model/domain`; `useForm` lives in the ViewModel; API field errors are mapped to form errors | [ADR-0021](docs/adr/0021-forms-in-viewmodels.md), `src/model/domain/patients/patient.form.ts` |
| **Design system** | Tailwind v4 CSS-first + shadcn/ui components in `shared/ui` | [ADR-0012](docs/adr/0012-tailwind-shadcn.md), `src/shared/ui/` |

---

## 3. SOLID principles applied

| Principle | How it is applied | References |
| --- | --- | --- |
| **S**: Single Responsibility | One Presenter per use case. Views only serialize. Mappers only translate. Repositories only persist. Adapters wrap one technology. In the web, Views only render, ViewModels hold UI logic and adapters shape data. | `apps/api/src/modules/patients/presenter/CreatePatientPresenter.ts`, `.../patients/infrastructure/PatientMapper.ts`, `apps/web/src/features/patients/view/PatientListPage.tsx` vs `.../viewmodel/usePatientListViewModel.ts` |
| **O**: Open/Closed | Adding a provider, algorithm or module adds a class and a line in the composition root, without editing consumers. Strategies cover payments, WhatsApp, meeting links and JWT signing. `Presenter.present()` and `HttpView.render()` are fixed templates with extension points. | `src/modules/subscriptions/model/PaymentGateway.ts`, `src/modules/virtual-consultations/model/ports.ts`, `src/infrastructure/security/TokenSigningAlgorithm.ts`, `src/app/modules.ts`, [ADR-0041](docs/adr/0041-pluggable-token-signing-algorithm.md) |
| **L**: Liskov Substitution | Every abstract port has interchangeable implementations that the same tests exercise: Mongoose vs in-memory repositories, local outbox vs WhatsApp Cloud API, Jitsi vs Google Meet, HS256 vs a test Ed25519 signer. | `apps/api/test/support/inMemory.ts`, `test/integration/in-memory.http.test.ts`, `src/modules/notifications/infrastructure/LocalWhatsAppOutbox.ts` / `WhatsAppCloudApiGateway.ts`, `test/unit/auth-model.test.ts` |
| **I**: Interface Segregation | Small, consumer-owned ports. Clinical records ask for `PatientLookup` and appointments for `PatientNames`, never the whole patients API. Other examples: `Clock`, `JobLock`, `HttpResponder`, the one-method `View<T>`, and the small `<Module>Presenters` registry per module. | `src/modules/clinical-records/model/PatientLookup.ts`, `src/modules/appointments/model/PatientNames.ts`, `src/core/model/Clock.ts`, `src/core/view/View.ts`, `src/modules/patients/presenter/PatientPresenters.ts` |
| **D**: Dependency Inversion | The Model owns its abstractions and infrastructure implements them. Services receive `Repository`, `TransactionManager`, `TokenService`, `PasswordHasher`, `Clock` and `IdGenerator` through the constructor. Notifiers depend on `DateFormatter`, not on `Intl`. ViewModels get `UserFeedback` and `BrowserActions` from `PlatformContext` instead of importing `sonner`, `window` or `navigator`. Singletons are resolved only in composition roots. In the web, Views depend on ViewModels, never on Redux or the API. Biome enforces all of this. | `src/modules/patients/model/PatientRepository.ts` ← `infrastructure/MongoosePatientRepository.ts`, `src/core/model/TransactionManager.ts`, `src/core/security/TokenService.ts` ← `infrastructure/security/JoseTokenService.ts` ← `TokenSigningAlgorithm`, `src/core/model/IdGenerator.ts`, `src/core/format/DateFormatter.ts`, `apps/web/src/model/platform/Platform.ts`, [ADR-0042](docs/adr/0042-dependency-inversion-for-platform-services.md), [ADR-0022](docs/adr/0022-cross-module-collaboration.md), [ADR-0024](docs/adr/0024-injectable-module-adapters.md) |

Paths starting with `src/` or `test/` are relative to `apps/api`.

---

## 4. Design patterns and references

Every class that applies a pattern carries a one-line `// <Pattern>` comment
([ADR-0035](docs/adr/0035-comments-name-design-patterns.md)). `grep -rn "// Strategy" apps` lists
the Strategy classes, for example. The full catalogue with tables is in
[docs/architecture/patterns.md](docs/architecture/patterns.md).

### Backend (`apps/api/src`, 188 tags)

| Pattern | Count | Example references |
| --- | --- | --- |
| Adapter | 45 | `infrastructure/logger/PinoLoggerAdapter.ts`, `infrastructure/format/IntlDateFormatter.ts`, `infrastructure/mail/SmtpMailTransport.ts`, `infrastructure/security/JoseTokenService.ts`, `modules/clinical-records/infrastructure/PatientDirectoryLookup.ts` |
| Presenter | 40 | `modules/patients/presenter/*Presenter.ts` (one per use case) |
| Repository | 24 | `core/model/Repository.ts`, `infrastructure/database/MongooseRepository.ts`, `modules/*/model/*Repository.ts` |
| Abstract Factory | 11 | `modules/patients/presenter/PatientPresenters.ts`, built by `modules/patients/PatientsModule.ts` |
| Composition Root | 12 | `main.ts`, `app/Application.ts`, `app/modules.ts`, every `modules/*/<Name>Module.ts` |
| Data Mapper | 10 | `core/model/DataMapper.ts`, `modules/*/infrastructure/*Mapper.ts` |
| Value Object | 9 | `core/model/ValueObject.ts`, `modules/clinical-records/model/Medication.ts`, `modules/subscriptions/model/Plan.ts` |
| Aggregate Root | 9 | `modules/clinical-records/model/ClinicalRecord.ts`, `modules/patients/model/Patient.ts`, `modules/appointments/model/Appointment.ts` |
| Passive View | 7 | `core/view/HttpView.ts`, `core/view/JsonHttpView.ts` |
| Strategy | 5 | `modules/subscriptions/model/PaymentGateway.ts`, `modules/notifications/model/WhatsAppGateway.ts`, `modules/virtual-consultations/model/ports.ts` (`MeetingLinkProvider`), `infrastructure/security/TokenSigningAlgorithm.ts` + `HmacSha256SigningAlgorithm.ts` |
| Singleton | 4 | `infrastructure/config/AppConfig.ts`, `infrastructure/logger/Logger.ts`, `infrastructure/database/MongoConnection.ts` (one connection pool per process), `infrastructure/openapi/OpenApiRegistry.ts` |
| Entity | 4 | `core/model/Entity.ts`, `core/model/Person.ts` |
| Unit of Work | 2 | `core/model/TransactionManager.ts`, `infrastructure/database/MongoTransactionManager.ts` |
| Template Method | 2 | `core/presenter/Presenter.ts` (`present` → `execute`), `core/view/HttpView.ts` (`renderError` → status mapping) |
| Command | 2 | `core/scheduling/ScheduledJob.ts`, `core/module/DataMigration.ts` |
| State | 1 | `modules/subscriptions/model/Subscription.ts` (trial, active, pending payment, suspended, expired) |
| Facade | 1 | `modules/notifications/model/NotificationCenter.ts` (WhatsApp → email fallback → delivery log) |

### Frontend (`apps/web/src`, 38 tags)

| Pattern | Count | Example references |
| --- | --- | --- |
| ViewModel | 23 | `features/patients/viewmodel/usePatientListViewModel.ts`, `features/session/viewmodel/useSessionViewModel.ts` |
| Adapter | 13 | `model/domain/patients/PatientAdapter.ts`, `model/api/ApiErrorAdapter.ts`, `model/domain/prescriptions/PrescriptionPdfAdapter.ts` (jsPDF), `model/platform/SonnerUserFeedback.ts`, `model/platform/WindowBrowserActions.ts` |
| Singleton | 1 | `app/store/AppStore.ts` (Redux store) |
| Composition Root | 1 | `app/AppProviders.tsx` (store and `PlatformContext`) |

---

## 5. Where to find the value of the code

A reviewer with limited time can follow this path.

1. **One use case end to end.** Register a patient (CU-04):
   - API:
     - `apps/api/src/modules/patients/view/PatientRoutes.ts` (route, parsing, view)
     - → `presenter/CreatePatientPresenter.ts`
     - → `model/PatientService.ts` (rules, transaction)
     - → `model/Patient.ts` (aggregate)
     - → `infrastructure/MongoosePatientRepository.ts` + `PatientMapper.ts`
   - Web:
     - `apps/web/src/features/patients/view/PatientFormDialog.tsx`
     - → `viewmodel/usePatientFormViewModel.ts`
     - → `model/domain/patients/patient.form.ts` + the generated hook
   - The sequence is drawn in [sequence-diagrams.md §1](docs/architecture/sequence-diagrams.md).
2. **The core abstractions every module reuses:** `apps/api/src/core/`. This folder holds Presenter,
   View/HttpView, Entity, ValueObject, Repository, DataMapper, TransactionManager, ScheduledJob and
   ApplicationError.
3. **Wiring:** `apps/api/src/app/modules.ts` is the single place where implementations are
   chosen: Mongo or in-memory, Jitsi or Meet, WhatsApp outbox or Cloud API, the signing algorithm,
   the clock, the id generator and the date formatter. In the web the equivalent is
   `apps/web/src/app/AppProviders.tsx`.
4. **Richest domain logic:**
   - `modules/subscriptions/model/Subscription.ts` (State) and `SubscriptionService.ts`.
   - `modules/appointments/model/AppointmentService.ts` (overlaps and agenda lock).
   - `modules/clinical-records/model/ClinicalRecord.ts` (append-only aggregate).
   - `modules/notifications/model/NotificationCenter.ts` (fallback).
5. **Security:**
   - `apps/api/src/infrastructure/http/AuthGuard.ts`, `SessionCookie.ts` and `RateLimiter.ts`.
   - `infrastructure/security/`.
   - `modules/auth/model/AuthService.ts` and `PasswordRecoveryService.ts`.
   - `apps/web/src/features/session/view/RouteGuards.tsx`.
6. **Proof that it works:**
   - `apps/api/test/integration/*.http.test.ts`: HTTP tests per module, including cross-tenant 404s.
   - `apps/api/test/integration/in-memory.http.test.ts`: the whole API on in-memory adapters (LSP).
   - `apps/api/test/unit/presenter.test.ts`: presenters tested with a `SpyView`.
   - `apps/web/src/**/*.test.ts(x)`: ViewModels with mocked hooks, Views with mocked ViewModels.
   - `tools/smoke/smoke.mjs`: end-to-end smoke test of the production images.
7. **How the architecture is kept honest:**
   - `biome.json` (per-layer `noRestrictedImports`).
   - `tools/biome/*.grit`.
   - `tools/comments/check-comments.mjs`.
   - `tools/docs/class-diagram.mjs`.
   - `.github/workflows/ci.yml`.
8. **Decisions and diagrams:**
   - [docs/adr/](docs/adr/README.md): why each choice was made.
   - [class diagram](docs/architecture/class-diagram.md), generated from code.
   - [sequence diagrams](docs/architecture/sequence-diagrams.md): 11 flows.
   - [glossary](docs/architecture/glossary.md): Spanish → English domain names.
9. **Running it:**
   - [SETUP.md](SETUP.md): setup, demo login (`demo@mentora.test` / `Demo1234`) and test data.
   - [try every use case locally](docs/guides/try-locally.md).
   - [operations](docs/operations/): deployment, configuration, backups, runbook, CI/CD.

### Commands to verify everything

```bash
pnpm install
docker compose up -d mongo mailpit
pnpm lint && pnpm typecheck && pnpm test   # architecture rules, types, 207 tests
pnpm dev                                    # web :5173, API :3000, Swagger :3000/api/docs
docker compose up --build                   # full stack in containers, web :8080
```

---

## 6. Known limits and next steps

- **Session revocation:** a stolen session token keeps working until its TTL (8 h), even after the
  password changes. This was accepted in
  [ADR-0034](docs/adr/0034-session-credentials-version.md). The next step is to check the
  credentials version on every request.
- **No roles:** the specification has one actor, the professional. Authorization is ownership
  plus subscription state, not RBAC. Roles would be needed only for secretaries or institutions.
- **Out of scope:**
  - MFA, email verification on sign-up, key rotation for JWT signing.
  - Storing generated prescriptions.
  - A real payment provider (the gateway is simulated).
- The full list is in [mvp-scope.md](docs/product/mvp-scope.md#known-limits) and the
  [production readiness checklist](docs/operations/production-readiness.md).
