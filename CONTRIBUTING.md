# Contributing

## Setup

Node 24, pnpm 12 and Docker. Then follow [getting started](docs/guides/getting-started.md):

```bash
pnpm install          # also installs the Lefthook git hooks
cp .env.example .env
docker compose up -d mongo mailpit
pnpm dev              # web http://localhost:5173, api http://localhost:3000/api/docs
```

## Workflow

1. Branch from `main`: `feat/<topic>`, `fix/<topic>`, `docs/<topic>`.
2. Read the ADR of the area you change (index in [CLAUDE.md](CLAUDE.md) and
   [docs/adr](docs/adr/README.md)). A new library, layer, pattern or convention needs a new ADR.
3. Follow the recipes: [backend module](docs/guides/add-backend-module.md),
   [frontend feature](docs/guides/add-frontend-feature.md).
4. Commit with [Conventional Commits](https://www.conventionalcommits.org) (`feat(api): …`); the
   commit-msg hook checks it.
5. Open a pull request with the template. Every CI check must pass and one review is required
   ([ci-cd.md](docs/operations/ci-cd.md)).

## Before pushing

```bash
pnpm lint             # Biome, architecture rules and the comment rule
pnpm typecheck
pnpm test
pnpm codegen          # if you changed a zod contract; commit the generated files
pnpm docs:classes     # if you added or changed classes; commit the class diagram
```

## Rules that CI enforces

- Layer boundaries of the API (MVP) and the web (MVVM) — Biome `[arch]` rules.
- No edits to generated files; no hand-written `fetch` or DTO types in the web.
- Comments only name a design pattern (`// Adapter`), see ADR-0035.
- No production dependency with a high or critical advisory.
