# ADR-0043: Demo data seed through the public API

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** tooling, ops, testing
- **Supersedes:** —

## Context and problem statement

`docker compose up` started an empty database. Anyone testing the product had to register an
account and type patients, consultations and appointments before reaching the interesting
screens. Testers and reviewers need one known login and realistic data right after start-up.
The local containers also ignored most of the developer's `.env`, because the compose file
repeated every variable with its own defaults.

## Decision drivers

- One command gives a usable system with a known login.
- Seeded data must satisfy the same rules as data typed in the UI, such as hashed passwords,
  DNI uniqueness, appointment overlap rules and DSM-5 codes.
- The seed must not couple to Mongo collections or internal classes.
- The seed must be safe to run on every start.
- Production must never be seeded.

## Considered options

1. A `mongorestore` of a fixture dump.
2. A TypeScript script that writes the collections with Mongoose models.
3. A script that calls the public HTTP API as a client, like the smoke test.

## Decision outcome

Chosen option: **3**. Options 1 and 2 bypass the Model, so they break silently when a schema or
an invariant changes. They also need hashed passwords and derived fields computed by hand.

- `tools/seed/seed-demo.mjs`, plain Node with no dependencies, does the following:
  1. Waits for `/api/health/ready`.
  2. Logs in as the demo account. If that works, it stops.
  3. Otherwise it registers the professional and creates the demo data through the use cases:
     - 8 patients, one of them discharged;
     - 8 consultations with diagnoses and medications;
     - 7 appointments, one of them cancelled;
     - 1 virtual meeting;
     - 1 test card and the monthly plan.
- Dates are relative to the run: consultations in the past, appointments in the next 7 days, at
  Buenos Aires office hours.
- `docker-compose.yml` adds a one-shot `seed` service:
  - image `node:24-alpine`, read-only, non-root;
  - the script is mounted read-only;
  - it waits for the healthy `api`.

  `docker-compose.prod.yml` has no such service.
- `pnpm seed` runs the same script against `pnpm dev`.
- Settings: `SEED_DEMO_DATA` (default `true`), `DEMO_EMAIL` (default `demo@mentora.test`) and
  `DEMO_PASSWORD` (default `Demo1234`).
- The local `api` service reads `.env` through `env_file`. Compose overrides only the values
  that must point at other containers (`MONGO_URI`, `SMTP_URL`, `CORS_ORIGIN`, `APP_URL`) and
  `NODE_ENV`.

### Consequences

- 👍 `docker compose up` leads straight to a populated app. `SETUP.md` documents the login.
- 👍 A contract change that breaks the seed fails visibly: the `seed` container exits with 1
  and logs the failing request.
- 👍 The local containers follow the developer's `.env`.
- 👎 The seed can only create states the API allows: no past appointments and no dormant
  patients. Those still come from tests or from the scheduled jobs.
- 👎 Appointment dates age, so testers reset the volume (`docker compose down -v`) when they are
  in the past.

## Enforcement

- Production compose has no `seed` service and no demo variables. Review keeps it that way.
- The seed uses only `/api` routes. Any API change that breaks it shows up on the next
  `docker compose up`.

## References

- [ADR-0014](0014-containerization.md), [ADR-0036](0036-ci-cd-quality-gates.md)
- `tools/seed/seed-demo.mjs`, `docker-compose.yml`, [SETUP.md](../../SETUP.md)
