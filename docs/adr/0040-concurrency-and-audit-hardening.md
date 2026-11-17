# ADR-0040: Concurrency and audit hardening

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** backend, security, data
- **Supersedes:** —

## Context and problem statement

The readiness review ([production-readiness.md](../operations/production-readiness.md)) left four
open edge cases:

- Two concurrent bookings of the same slot could both pass the overlap check. Snapshot isolation
  does not see the other transaction's insert.
- Rate limits were counted in each process, so N API instances allowed N times the limit.
- Nobody could tell who had opened a clinical record.
- Patients without a phone never received the CU-15 invitation or the agenda messages.

## Decision drivers

- Fix each case without new infrastructure. MongoDB is already a replica set with transactions
  (ADR-0025).
- Keep the Model free of technology: every fix is a port with an adapter (ADR-0007, ADR-0024).
- Keep the API runnable on in-memory adapters.

## Considered options

1. Unique index on `(professionalId, startsAt)` against double booking. It does not catch partial
   overlaps.
2. **Agenda lock document per professional, written inside the booking transaction.**
3. Redis for rate limits and locks. It is one more service to run, secure and back up.
4. **A MongoDB collection for rate-limit windows, with a TTL index.**
5. Access logging in an HTTP middleware. It would not know the use case or the consultation id.
6. **An append-only access log written by `ClinicalRecordService`.**
7. **Email fallback inside `NotificationCenter`, after WhatsApp.**

## Decision outcome

Chosen options: **2, 4, 6 and 7**.

### Agenda lock

`AgendaLock.acquire(professionalId)` (port in the appointments Model) runs first in `schedule` and
`reschedule`. `MongooseAgendaLock` does `$inc` on `agenda_locks/{professionalId}` with the
transaction session.

- Two concurrent bookings write the same document. The second gets a `WriteConflict`.
- `connection.transaction` retries it, and the retry sees the first booking and answers 409.
- Bookings of different professionals never wait for each other.

### Rate limits

`RateLimiter` counts hits through the `RateLimitStore` port. `MongoRateLimitStore` uses an atomic
pipeline `findOneAndUpdate` with upsert on `rate_limits/{rule}:{key}`: it increments inside the
window, or resets the count to 1 with a new `resetsAt`. A TTL index on `resetsAt` removes old
windows.

### Clinical record access log

`RecordAccessLog` (port) stores `{ professionalId, patientId, action, consultationId, at }`.
`ClinicalRecordService` appends an entry after each of these:

- reading the record;
- reading a consultation;
- reading the diagnosis history;
- registering a consultation, inside its transaction.

The adapter only inserts and reads. `GET /patients/{id}/clinical-record/access-log` returns the
latest 100 entries to the owner; reading the log is not logged itself. The web shows it in the
"Access log" tab.

### Email fallback

`NotificationCenter.send` replaces `sendWhatsApp`:

1. It tries WhatsApp when the patient has a phone.
2. If there is no phone, or WhatsApp fails, it sends an email through the `EmailGateway` port
   (`MailEmailGateway` over `MailTransport`, ADR-0027).

Each attempt is a `Notification` with its `channel` (`whatsapp` or `email`). The two adapters that
use it are now `NotificationAppointmentNotifier` and `NotificationMeetingInvitations`.

### Consequences

- 👍 Double booking, per-instance limits, missing invitations and unaudited record reads are closed
  with tests that reproduce them.
- 👍 No new service; the in-memory adapters cover the new ports.
- 👎 Bookings of one professional are serialized, which is fine at agenda volumes.
- 👎 Each limited request adds one MongoDB round trip, and each clinical read adds one insert.
- 👎 The access log keeps who and when, not the IP or device.
- 👎 An email fallback after a WhatsApp failure can reach a patient who also got the WhatsApp late.

## Enforcement

- `appointments.http.test.ts` books one slot 5 times concurrently and expects exactly one 201.
- `mongoose-repository.test.ts` hits `MongoRateLimitStore` concurrently from two instances.
- `clinical-records.http.test.ts` checks the access log order and the 404 for another professional.
- `integrations.test.ts` and `care-automation.http.test.ts` cover the email fallback.
- Review: new reads of the clinical record must go through `ClinicalRecordService` so they are
  logged.

## References

- [ADR-0025](0025-transactions-with-context.md), [ADR-0027](0027-email-smtp-mailpit.md),
  [ADR-0030](0030-whatsapp-notifications.md), [ADR-0037](0037-operational-readiness.md)
- [Production readiness](../operations/production-readiness.md)
