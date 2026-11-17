# Architecture overview

## System context

```mermaid
flowchart LR
  user([User browser]) -->|HTTPS| web[web · nginx + React SPA]
  web -->|/api proxy| api[api · Express 5, MVP]
  api -->|Mongoose, transactions| mongo[(MongoDB 8 replica set)]
  api -.->|/api/docs| swagger[Swagger UI]
  api -->|SMTP| mail[Mailpit / SMTP server]
  api -->|PaymentGateway| pay[Simulated gateway / payment provider]
  api -->|WhatsAppGateway| wa[Local outbox / WhatsApp Cloud API]
  api -->|MeetingLinkProvider| meet[Jitsi / Google Meet]
  web -.->|join link| meet
```

External services are reached through Model-owned ports and adapters (ADR-0007); the local
adapters are the default (ADR-0027, 0029, 0030, 0031).

## Backend modules

```mermaid
flowchart LR
  auth --> subscriptions
  clinical[clinical-records] --> patients
  clinical --> catalog[diagnosis-catalog]
  appointments --> patients
  appointments --> notifications
  virtual[virtual-consultations] --> patients
  virtual --> appointments
  virtual --> notifications
```

Arrows are calls through query or command services exported by `index.ts` (ADR-0022, ADR-0033),
wired in `apps/api/src/app/modules.ts`. Modules with periodic work declare scheduled jobs
(ADR-0026).

## Monorepo

```
apps/
  api/                 Express API — OOP, MVP Passive View        (ADR-0004, ADR-0005)
  web/                 Vite + React SPA — MVVM, RTK Query          (ADR-0011)
packages/
  contracts/           openapi.json + generated DTO types          (ADR-0009, ADR-0010)
  tsconfig/            shared tsconfig presets                     (ADR-0003)
docker/                Dockerfiles, nginx, Mongo users, backup     (ADR-0014, ADR-0038, ADR-0039)
docs/                  ADRs, architecture, guides, operations
tools/biome/           GritQL architecture plugins                 (ADR-0013)
tools/comments/        comment rule checker                        (ADR-0035)
tools/docs/            class diagram generator                     (ADR-0036)
tools/smoke/ tools/ops/ tools/db/   smoke test, restore drill, dev backups (ADR-0036, ADR-0039)
.github/               CI, CodeQL, release, Dependabot             (ADR-0036)
```

## End-to-end flow of one use case

More flows (login, payments, jobs, backups) are in [sequence-diagrams.md](sequence-diagrams.md);
every class is in the generated [class-diagram.md](class-diagram.md).

```mermaid
sequenceDiagram
  participant V as web View (HealthPage)
  participant VM as ViewModel (useHealthViewModel)
  participant RTK as Generated hook (useGetHealthQuery)
  participant R as API Routes (HealthRoutes)
  participant HV as HttpView (HealthHttpView)
  participant P as Presenter (GetHealthPresenter)
  participant M as Model (HealthService)
  V->>VM: render / user intent
  VM->>RTK: subscribe / refetch
  RTK->>R: GET /api/health
  R->>HV: new HealthHttpView(responder)
  R->>P: factory.getHealth(view).present()
  P->>M: getReport()
  M-->>P: HealthReport (domain)
  P->>HV: render(HealthDto)
  HV-->>RTK: 200 JSON
  RTK-->>VM: data (HealthDto)
  VM-->>V: HealthUiModel via HealthAdapter
```

## Contract pipeline

```
zod schemas (apps/api/src/modules/*/contracts)
   │  OpenApiRegistry (Adapter + Singleton)
   ▼
packages/contracts/openapi.json ──► /api/docs (Swagger UI)
   │                    │
   │ openapi-typescript │ @rtk-query/codegen-openapi
   ▼                    ▼
@mentora/contracts    apps/web/src/model/api/generated/mentoraApi.ts
(DTO types)           (endpoints + hooks)
```
