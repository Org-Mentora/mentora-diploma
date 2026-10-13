# ADR-0014: Containerization with Docker and Compose

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** Mentora team
- **Tags:** ops
- **Supersedes:** —

## Context and problem statement

Everyone on the team, plus CI and the eventual deployment target, must run the same stack
(API + SPA + MongoDB) without manual setup.

## Decision drivers

- One-command startup.
- Small, non-root production images.
- A hot-reload development option without installing MongoDB locally.

## Considered options

1. Multi-stage Dockerfiles per app + Docker Compose (prod and dev overlays)
2. Dev containers only
3. No containers (local installs)

## Decision outcome

Chosen option: **multi-stage Dockerfiles in `docker/` + Compose.**

- `docker/api.Dockerfile` has these stages:
  - `deps` installs the filtered workspace (manifests only, for layer caching).
  - `dev` runs `tsx watch`.
  - `build` runs tsup and `pnpm deploy --prod`.
  - `runtime` is `node:24-alpine`, runs as the `node` user and has a healthcheck on `/api/health`.
- `docker/web.Dockerfile` has these stages:
  - `deps` installs the workspace.
  - `dev` runs the Vite dev server.
  - `build` runs `vite build`.
  - `runtime` is `nginx:1.29-alpine`. It serves the SPA with history fallback and proxies
    `/api` to `${API_UPSTREAM}`.
- `docker-compose.yml` runs `mongo:8`, `api` and `web`, with healthchecks and ordered startup.
  - Ports: web on 8080, api on 3000, mongo on 27017.
- `docker-compose.dev.yml` is an overlay that uses the `dev` targets with `docker compose watch`
  (source sync + rebuild on `package.json`). Vite runs on 5173.
- Only `AppConfig` reads environment variables; see `.env.example`.

### Consequences

- 👍 `docker compose up --build` gives a production-like stack.
- 👎 Building images needs BuildKit (default in current Docker).

## Enforcement

The CI `docker` job builds both images on every push.

## References

- [docs/guides/getting-started.md](../guides/getting-started.md)
