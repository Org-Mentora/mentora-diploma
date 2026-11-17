# Architecture Decision Records

We record every architecturally significant decision as an ADR using the
[MADR](https://adr.github.io/madr/) format (see [ADR-0001](0001-record-architecture-decisions.md)).

- ADRs are **immutable once accepted**. To change a decision, write a new ADR that
  supersedes the old one, and update the status of both.
- Numbering is sequential and never reused.
- Start from [`template.md`](template.md). The guide [Adding an ADR](../guides/adding-an-adr.md)
  explains the workflow, including updating the index in the root `CLAUDE.md`.

## Index

| ADR | Title | Status | Area |
| --- | --- | --- | --- |
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted | process |
| [0002](0002-monorepo-pnpm-turborepo.md) | Monorepo with pnpm workspaces and Turborepo | Accepted | tooling |
| [0003](0003-typescript-esm-node24.md) | TypeScript strict, ESM and Node 24 | Accepted | tooling |
| [0004](0004-backend-mvp-passive-view.md) | Backend architecture: MVP (Passive View) | Accepted | backend |
| [0005](0005-backend-oop-conventions.md) | Object-oriented conventions for the backend | Accepted | backend |
| [0006](0006-singleton-pattern.md) | Singleton pattern for process-wide resources | Accepted | patterns |
| [0007](0007-adapter-pattern.md) | Adapter pattern at every technology boundary | Accepted | patterns |
| [0008](0008-mongodb-mongoose.md) | MongoDB with Mongoose | Accepted | backend |
| [0009](0009-code-first-openapi.md) | Code-first OpenAPI with zod and Swagger UI | Accepted (amended by 0023) | api |
| [0010](0010-frontend-codegen.md) | Generated DTO types and RTK Query hooks | Accepted | api, frontend |
| [0011](0011-frontend-mvvm.md) | Frontend architecture: MVVM | Accepted | frontend |
| [0012](0012-tailwind-shadcn.md) | Tailwind CSS v4 and shadcn/ui | Accepted | frontend |
| [0013](0013-biome-architecture-linting.md) | Biome for linting, formatting and architecture rules | Accepted | tooling |
| [0014](0014-containerization.md) | Containerization with Docker and Compose | Accepted (amended by 0038) | ops |
| [0015](0015-testing-strategy.md) | Testing strategy | Accepted | quality |
| [0016](0016-english-only.md) | English for code and documentation | Accepted | process |
| [0017](0017-agent-context.md) | Context strategy for AI coding agents | Accepted | process |
| [0018](0018-authentication-session-cookie.md) | Authentication with a JWT in an httpOnly cookie | Accepted | backend, security |
| [0019](0019-per-professional-data-ownership.md) | Per-professional data ownership | Accepted | backend, security |
| [0020](0020-clinical-record-aggregate.md) | Clinical record as an aggregate with embedded consultations | Accepted | domain |
| [0021](0021-forms-in-viewmodels.md) | Forms live in ViewModels (react-hook-form + zod) | Accepted | frontend |
| [0022](0022-cross-module-collaboration.md) | Cross-module collaboration through Model-owned abstractions | Accepted | backend |
| [0023](0023-openapi-3-1-nullable-refs.md) | Emit OpenAPI 3.1 and declare nullable references explicitly | Accepted | api |
| [0024](0024-injectable-module-adapters.md) | Injectable module adapters with production defaults | Accepted | backend |
| [0025](0025-transactions-with-context.md) | Database transactions through a transaction context | Accepted | backend |
| [0026](0026-scheduled-jobs.md) | In-process scheduled jobs declared by modules | Accepted | backend, patterns |
| [0027](0027-email-smtp-mailpit.md) | Outbound email through SMTP (nodemailer), with Mailpit locally | Accepted | backend, ops |
| [0028](0028-password-recovery-codes.md) | Password recovery with short-lived, hashed, single-use codes | Accepted | backend, security |
| [0029](0029-subscriptions-and-payments.md) | Subscriptions module with a payment gateway port and a simulated gateway | Accepted | backend, domain, security |
| [0030](0030-whatsapp-notifications.md) | WhatsApp notifications module with a delivery log and a local outbox | Accepted | backend, integration |
| [0031](0031-video-call-providers.md) | Video calls through a link provider port (Jitsi locally, Google Meet optional) | Accepted | backend, integration |
| [0032](0032-logo-storage-and-client-pdf.md) | Logo stored in MongoDB; prescriptions printed and rendered to PDF in the browser | Accepted | backend, frontend |
| [0033](0033-cross-module-commands.md) | Cross-module commands inside the caller's transaction | Accepted | backend, patterns |
| [0034](0034-session-credentials-version.md) | Session tokens carry a credentials version | Accepted | backend, security |
| [0035](0035-comments-name-design-patterns.md) | Code comments only name the design pattern | Accepted | process, patterns |
| [0036](0036-ci-cd-quality-gates.md) | CI/CD quality gates and release pipeline | Accepted | tooling, ops, security |
| [0037](0037-operational-readiness.md) | Operational readiness of the API | Accepted | backend, ops, security |
| [0038](0038-production-images-and-deployment.md) | Production images and single-host deployment | Accepted | ops, security |
| [0039](0039-database-backup-strategy.md) | Database backup strategy | Accepted | ops, data |
| [0040](0040-concurrency-and-audit-hardening.md) | Concurrency and audit hardening | Accepted | backend, security, data |
| [0041](0041-pluggable-token-signing-algorithm.md) | Pluggable token signing algorithm | Accepted | backend, security |
| [0042](0042-dependency-inversion-for-platform-services.md) | Dependency inversion for platform services | Accepted | backend, frontend, patterns |
| [0043](0043-demo-data-seed.md) | Demo data seed through the public API | Accepted | tooling, ops, testing |
| [0044](0044-user-audit-trail.md) | User audit trail | Accepted | backend, security, data |
| [0045](0045-patient-online-booking.md) | Patient online booking | Accepted | backend, frontend, domain |
| [0046](0046-consultation-fees-and-earnings.md) | Consultation fees and earnings report | Accepted | backend, frontend, data |
| [0047](0047-web-internationalization.md) | Web internationalization with i18next | Accepted | frontend, tooling |
