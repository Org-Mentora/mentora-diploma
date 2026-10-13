# Getting started

## Prerequisites

- Node.js 24 (`.nvmrc`)
- pnpm 12. Run `corepack enable`, or `npm i -g pnpm` if corepack cannot write to the Node folder.
- Docker Desktop (for MongoDB or the full stack)

## Local development (recommended)

```bash
pnpm install                 # also installs git hooks (lefthook)
cp .env.example .env
docker compose up -d mongo   # only the database
pnpm dev                     # api :3000 (tsx watch) + web :5173 (Vite, proxies /api)
```

- Swagger UI: <http://localhost:3000/api/docs>
- Web: <http://localhost:5173>

## Full stack in containers

```bash
docker compose up --build        # web :8080, api :3000, mongo :27017
docker compose down              # stop (add -v to drop the database volume)
```

Containerised development with hot reload:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml watch
```

## Everyday commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run api + web in watch mode |
| `pnpm lint` / `pnpm lint:fix` | Biome format + lint + **architecture rules** |
| `pnpm typecheck` | `tsc --noEmit` in every package |
| `pnpm test` | Vitest in every package |
| `pnpm build` | Build api (tsup) and web (vite) |
| `pnpm codegen` | Regenerate OpenAPI → DTO types → RTK Query hooks |
| `pnpm codegen:check` | Fail if generated code is stale (CI) |

## Troubleshooting

- **First API test run is slow:** `mongodb-memory-server` downloads a MongoDB binary once.
- **`ERR_PNPM_IGNORED_BUILDS`:** run `pnpm approve-builds`. Allowed builds are listed in
  `pnpm-workspace.yaml`.
- **Commit rejected:** Lefthook runs Biome and checks the
  [Conventional Commits](https://www.conventionalcommits.org) format (`feat(api): ...`).
