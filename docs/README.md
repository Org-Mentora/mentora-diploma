# Mentora documentation

| Section | Contents |
| --- | --- |
| [Architecture decisions](adr/README.md) | ADRs: why things are the way they are (with history) |
| [Architecture overview](architecture/overview.md) | System context, monorepo layout, request lifecycle |
| [Backend — MVP](architecture/backend-mvp.md) | Layers, flow and rules of the API |
| [Frontend — MVVM](architecture/frontend-mvvm.md) | Layers, flow and rules of the SPA |
| [Design patterns](architecture/patterns.md) | Where each design pattern is applied, and how |
| [Class diagram](architecture/class-diagram.md) | Generated from the code: every class per layer and module |
| [Sequence diagrams](architecture/sequence-diagrams.md) | Login, registration, recovery, consultation, appointments, video call, payments, jobs, backups |
| [API reference](api/README.md) | Swagger UI, OpenAPI document, error format, endpoints |
| [Product scope](product/mvp-scope.md) | Use cases (CU) implemented and the external services behind them |
| [Glossary](architecture/glossary.md) | Spanish domain terms → English names in code |
| **Guides** | |
| [Getting started](guides/getting-started.md) | Install, run locally or in Docker |
| [Try every use case locally](guides/try-locally.md) | Walkthrough, test cards, Mailpit, WhatsApp outbox, jobs |
| [Add a backend module](guides/add-backend-module.md) | Step by step: model → presenter → view → contracts |
| [Add a frontend feature](guides/add-frontend-feature.md) | Step by step: codegen → adapter → viewmodel → view |
| [Code generation](guides/codegen.md) | OpenAPI → DTO types → RTK Query hooks |
| [Adding an ADR](guides/adding-an-adr.md) | How to record or supersede a decision |
| **Operations** | |
| [Production readiness](operations/production-readiness.md) | Checklist by section: security, reliability, observability, data, delivery, compliance |
| [Deployment](operations/deployment.md) | Images, host, first deployment, TLS, upgrade and rollback |
| [Configuration](operations/configuration.md) | Every environment variable and secret |
| [Backup and restore](operations/backup-and-restore.md) | RPO/RTO, schedule, offsite copy, restore and drill |
| [Runbook](operations/runbook.md) | Monitoring, logs, incidents, routine tasks, secret rotation |
| [CI/CD](operations/ci-cd.md) | Workflows, required checks, releasing, supply chain |
