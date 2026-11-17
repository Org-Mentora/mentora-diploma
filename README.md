# Mentora

Monorepo for the Mentora platform.

| Package | Description |
| --- | --- |
| `apps/api` | Express 5 REST API — OOP, **MVP (Passive View)** architecture, MongoDB |
| `apps/web` | Vite + React 19 SPA — **MVVM** architecture, RTK Query, Tailwind v4 + shadcn/ui |
| `packages/contracts` | Generated OpenAPI spec and DTO types shared with the frontend |
| `packages/tsconfig` | Shared TypeScript configurations |

## Quick start

```bash
corepack enable        # or: npm i -g pnpm
pnpm install
cp .env.example .env
docker compose up -d mongo mailpit   # MongoDB replica set + email inbox (:8025)
pnpm dev                             # api on :3000, web on :5173
```

Full stack in containers:

```bash
docker compose up --build   # web on :8080, api on :3000, swagger on :3000/api/docs
```

All 18 use cases are implemented; external services run with local adapters
([product scope](docs/product/mvp-scope.md), [try it locally](docs/guides/try-locally.md)).

## Production

```bash
cp .env.production.example .env.production   # fill every secret
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --wait
```

Hardened images on GHCR, MongoDB with authentication, daily backups with a tested restore.
See [deployment](docs/operations/deployment.md), [backups](docs/operations/backup-and-restore.md)
and the [production readiness checklist](docs/operations/production-readiness.md).

## Quality gates

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm codegen:check`, `pnpm docs:check`
and an end-to-end smoke test of the production images run on every pull request
([CI/CD](docs/operations/ci-cd.md)). Contributing: [CONTRIBUTING.md](CONTRIBUTING.md). Security
reports: [SECURITY.md](SECURITY.md).

## Documentation

Everything lives in [`docs/`](docs/README.md): architecture decision records, architecture
overviews, class and sequence diagrams, step-by-step guides and operations. AI agents start from [`CLAUDE.md`](CLAUDE.md).
