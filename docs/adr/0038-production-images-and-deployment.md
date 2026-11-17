# ADR-0038: Production images and single-host deployment

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** ops, security
- **Supersedes:** — (amends [ADR-0014](0014-containerization.md))

## Context and problem statement

ADR-0014 defined multi-stage images and a Compose file for development. The runtime images ran
nginx as root on port 80, MongoDB had no authentication, and there was no description of how to
run Mentora for real users. "Virtualizing" the product means shipping it as versioned,
hardened container images and a reproducible way to run them.

## Decision drivers

- Least privilege: no root processes, read-only file systems, no credentials in images.
- One versioned artifact per component, built once and promoted.
- A deployment that one person can run on one VM, with a clear path to an orchestrator.

## Considered options

1. Hardened images on GHCR plus `docker-compose.prod.yml` for a single host.
2. Kubernetes manifests or Helm charts from the start.
3. A PaaS (Render, Fly.io) with a managed MongoDB.

## Decision outcome

Chosen option: **1. Hardened images and a production Compose file.** Kubernetes is the next step
when more than one host is needed; the images and probes already fit it.

Images (`docker/*.Dockerfile`, target `runtime`):

- API: `node:24-alpine`, production dependencies only, runs as `node`, `STOPSIGNAL SIGTERM`,
  health check on `/api/health/live`, OCI labels with version and commit, `APP_VERSION` env.
- Web: `nginxinc/nginx-unprivileged:1.29-alpine` (uid 101) on port **8080**, `server_tokens off`,
  security headers (CSP, `X-Frame-Options DENY`, `nosniff`, `Referrer-Policy`,
  `Permissions-Policy`), `X-Request-Id` passthrough, 2 MB body limit, `/healthz`.

`docker-compose.prod.yml` (project `mentora-prod`):

- MongoDB 8 single-node replica set (needed for transactions, ADR-0025) with authentication and
  an internal key file generated once into a volume. Three users: `root`, `mentora` (`readWrite`
  on `mentora`, used by the API) and `backup` (`backup` + `restore` roles).
- API and web from GHCR at `${MENTORA_VERSION}`, `read_only: true`, `tmpfs` for writable paths,
  `no-new-privileges`, memory limits, `json-file` logs rotated at 10 MB × 5.
- Only the web container publishes a port. TLS terminates in front of it (Caddy, a cloud load
  balancer or nginx with certbot) and forwards to `PUBLIC_PORT`.
- A `backup` service (ADR-0039).
- Secrets come from `.env.production` (git-ignored); `.env.production.example` lists them. The
  file uses `${VAR:?}` so the stack refuses to start with a missing secret.

### Consequences

- 👍 The exact images tested by CI e2e are the ones deployed.
- 👍 A compromised API cannot write to its image, escalate privileges or reach MongoDB as admin.
- 👎 The development port of the web container changed from 80 to 8080.
- 👎 A single MongoDB node: no automatic failover. RPO/RTO rely on backups (ADR-0039).

## Enforcement

- CI e2e starts this compose file and smoke-tests it (ADR-0036).
- `docs/operations/deployment.md` and `production-readiness.md` keep the checklist.

## References

- ADR-0014, ADR-0025, ADR-0036, ADR-0037, ADR-0039
