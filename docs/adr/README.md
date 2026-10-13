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
| [0009](0009-code-first-openapi.md) | Code-first OpenAPI with zod and Swagger UI | Accepted | api |
| [0010](0010-frontend-codegen.md) | Generated DTO types and RTK Query hooks | Accepted | api, frontend |
| [0011](0011-frontend-mvvm.md) | Frontend architecture: MVVM | Accepted | frontend |
| [0012](0012-tailwind-shadcn.md) | Tailwind CSS v4 and shadcn/ui | Accepted | frontend |
| [0013](0013-biome-architecture-linting.md) | Biome for linting, formatting and architecture rules | Accepted | tooling |
| [0014](0014-containerization.md) | Containerization with Docker and Compose | Accepted | ops |
| [0015](0015-testing-strategy.md) | Testing strategy | Accepted | quality |
| [0016](0016-english-only.md) | English for code and documentation | Accepted | process |
| [0017](0017-agent-context.md) | Context strategy for AI coding agents | Accepted | process |
