# ADR-0044: User audit trail

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** backend, security, data
- **Supersedes:** —

## Context and problem statement

The product needs a user audit module: who did what, when and from where in each practice.
ADR-0040 already logs reads and writes of clinical records, but logins, patient changes,
appointments, payments, settings and online bookings left no trace. Every module produces these
events, so the mechanism must not make modules depend on each other or on HTTP.

## Decision drivers

- One append-only log per professional (ADR-0019), readable by the professional.
- An event is written atomically with the change it describes. A rolled-back use case leaves no
  event.
- Models stay transport-agnostic (ADR-0004), yet the event records the IP, user agent and
  request id.
- No new library.

## Considered options

1. Each module writes its own log collection.
2. An HTTP middleware that logs every mutating request.
3. A core `AuditTrail` port injected into each Model service, implemented by an `audit` module.

## Decision outcome

Chosen option: **3**. Option 1 scatters the log. Option 2 sees URLs, not business facts, and it
cannot tell a failed use case from a successful one.

- **Port.** `#core/model/AuditTrail` declares `record({ professionalId, action, actor, target,
  details })`. Actions are `<category>.<verb>`, for example `appointment.scheduled`. Details
  are flat primitives.
- **Writer.** Services call `record` inside their `TransactionManager.run`, so the event commits
  or rolls back with the change. The exception is a failed login: it is recorded outside the
  transaction and its errors are swallowed.
- **Module.** The `audit` module owns `AuditEvent`, the append-only collection `audit_events`
  and `GET /api/audit/events`. That endpoint uses a cursor (`before` = `occurredAt_id`) and
  filters by category and date.
- **Request origin.** `AppModule` gains an optional `requestHandlers()` hook. `ExpressServer`
  mounts the hook's handlers on `/api` before the routers. The audit module uses it to run
  each request inside `RequestOriginContext`, an `AsyncLocalStorage` that holds the IP, the
  user agent and the request id. `AuditLog` reads it through the `RequestOriginSource` port.
- **Wiring.** `src/app/modules.ts` creates the audit module first and passes `auditing.trail`
  as a required dependency to every module.
- **Web.** The web shows the log in `/settings/activity`.

### Consequences

- 👍 Each business fact is logged once, by the use case that owns it. The log is consistent
  with the data.
- 👍 Modules depend only on a core port. The `audit` module knows nobody.
- 👎 Each new use case must remember to call `audit.record`. Review and tests catch omissions.
- 👎 The collection grows without a retention policy. Archiving is future work.

## Enforcement

- `AuditTrail` is a required constructor dependency, so a service cannot be built without it.
  The TypeScript compiler fails if a wiring forgets it.
- `test/integration/booking.http.test.ts` asserts the trail of a full flow.
- `RecordingAuditTrail` (`test/support/inMemory.ts`) lets unit tests assert events.
- Biome keeps `#infrastructure` out of models, so the origin is only reachable through the
  port.

## References

- `apps/api/src/core/model/AuditTrail.ts`, `apps/api/src/modules/audit/`
- `apps/api/src/infrastructure/http/RequestOriginContext.ts`
- ADR-0019, ADR-0025, ADR-0040
