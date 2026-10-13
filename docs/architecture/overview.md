# Architecture overview

## System context

```mermaid
flowchart LR
  user([User browser]) -->|HTTPS| web[web · nginx + React SPA]
  web -->|/api proxy| api[api · Express 5, MVP]
  api -->|Mongoose| mongo[(MongoDB 8)]
  api -.->|/api/docs| swagger[Swagger UI]
```

## Monorepo

```
apps/
  api/                 Express API — OOP, MVP Passive View        (ADR-0004, ADR-0005)
  web/                 Vite + React SPA — MVVM, RTK Query          (ADR-0011)
packages/
  contracts/           openapi.json + generated DTO types          (ADR-0009, ADR-0010)
  tsconfig/            shared tsconfig presets                     (ADR-0003)
docker/                Dockerfiles + nginx template                (ADR-0014)
docs/                  ADRs, architecture, guides
tools/biome/           GritQL architecture plugins                 (ADR-0013)
```

## End-to-end flow of one use case

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
