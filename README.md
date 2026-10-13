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
docker compose up -d mongo
pnpm dev               # api on :3000, web on :5173
```

Full stack in containers:

```bash
docker compose up --build   # web on :8080, api on :3000, swagger on :3000/api/docs
```

## Documentation

Everything lives in [`docs/`](docs/README.md): architecture decision records, architecture
overviews and step-by-step guides. AI agents start from [`CLAUDE.md`](CLAUDE.md).
