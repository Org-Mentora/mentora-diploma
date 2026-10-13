# Mentora documentation

| Section | Contents |
| --- | --- |
| [Architecture decisions](adr/README.md) | ADRs: why things are the way they are (with history) |
| [Architecture overview](architecture/overview.md) | System context, monorepo layout, request lifecycle |
| [Backend — MVP](architecture/backend-mvp.md) | Layers, flow and rules of the API |
| [Frontend — MVVM](architecture/frontend-mvvm.md) | Layers, flow and rules of the SPA |
| [Design patterns](architecture/patterns.md) | Where Singleton and Adapter are applied, and how |
| [API reference](api/README.md) | Swagger UI, OpenAPI document, error format, endpoints |
| [MVP scope](product/mvp-scope.md) | Which use cases (CU) are implemented and which are deferred |
| [Glossary](architecture/glossary.md) | Spanish domain terms → English names in code |
| **Guides** | |
| [Getting started](guides/getting-started.md) | Install, run locally or in Docker |
| [Add a backend module](guides/add-backend-module.md) | Step by step: model → presenter → view → contracts |
| [Add a frontend feature](guides/add-frontend-feature.md) | Step by step: codegen → adapter → viewmodel → view |
| [Code generation](guides/codegen.md) | OpenAPI → DTO types → RTK Query hooks |
| [Adding an ADR](guides/adding-an-adr.md) | How to record or supersede a decision |
