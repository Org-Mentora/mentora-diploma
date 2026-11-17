# ADR-0037: Operational readiness of the API

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** backend, ops, security
- **Supersedes:** —

## Context and problem statement

The API had a single `/api/health` endpoint, no protection against password guessing, no way to
correlate a user's error with a log line, and stopped abruptly on `SIGTERM`. The scheduled jobs
(ADR-0026) would run once per instance if the API were scaled, sending duplicate reminders and
charges. One-off data migrations ran on every boot.

## Decision drivers

- Orchestrators (Compose, Kubernetes) need to know when to restart and when to route traffic.
- Brute force on login, registration and recovery codes must be slowed down.
- Every error a user sees must be traceable in the logs.
- Deployments must not cut requests or jobs in the middle.
- Stay with the current stack: no Redis, no new services.

## Considered options

1. In-process mechanisms backed by MongoDB where shared state is needed.
2. Add Redis for rate limits and locks.
3. Leave it to the reverse proxy or the platform.

## Decision outcome

Chosen option: **1. In-process, with MongoDB for shared state.**

- **Probes.** `GET /api/health/live` reports only the process (never depends on MongoDB, so a
  database outage does not restart the API). `GET /api/health/ready` checks MongoDB and answers
  503 until it is reachable. `/api/health` stays as the detailed report.
- **Rate limiting.** `RateLimiter` (fixed window, in memory) on the public auth endpoints:
  login 10 per 15 min per IP + email and 50 per 15 min per IP; register 10/h per IP; recovery 5/h
  per email and 20/h per IP; code verification and reset 30 per 15 min per IP. Over the limit →
  429 `TOO_MANY_REQUESTS` with `Retry-After`. `RATE_LIMIT_ENABLED` turns it off for tests.
  `TRUST_PROXY` makes the client IP come from `X-Forwarded-For` behind nginx.
- **Request id.** Every response carries `X-Request-Id` (a valid incoming one is kept, otherwise a
  UUID). The same id is the request id of the pino HTTP log line of that request, so a user can report
  the header value of a failed call.
- **Graceful shutdown.** On `SIGTERM`/`SIGINT` the API stops accepting connections and waits for
  running requests, stops the scheduler and waits for running jobs, closes MongoDB, and exits; after
  `SHUTDOWN_TIMEOUT_MS` it forces the exit. Keep-alive is 65 s so a proxy never reuses a closed
  socket. Unhandled rejections are logged.
- **Job lock.** `JobLock` (core abstraction) and `MongoJobLock` (lease in `job_locks`): an
  instance runs a job only if it holds the lease. Jobs stay idempotent (ADR-0026).
- **Migrations.** A module root declares one-off data fixes in `migrations()` (a `DataMigration`
  Command, like `scheduledJobs()`). `Application.runMigrations()` runs each one through
  `MigrationLog.runOnce(name, work)`, which records it in the `migrations` collection, so a
  backfill runs once per database. `onBootstrap()` keeps only idempotent seeding, so the API can
  boot on in-memory adapters (ADR-0024).

### Consequences

- 👍 Health checks in the images and the production compose use the right probe.
- 👍 Scaling the API to several instances no longer duplicates job work.
- 👎 The rate limiter is per instance; with N instances the effective limit is N times higher.
  A shared store (Mongo TTL collection or Redis) is the upgrade path if that matters.

## Enforcement

- Tests: `rate-limiter.test.ts`, `http.test.ts` (probes and request id), `MongoJobLock` in the
  repository tests.
- The CI smoke test calls both probes on the production images.

## References

- ADR-0018, ADR-0026, ADR-0028, ADR-0038
