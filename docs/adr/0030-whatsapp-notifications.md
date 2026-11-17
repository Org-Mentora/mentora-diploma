# ADR-0030: WhatsApp notifications module with a delivery log and a local outbox

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** backend, integration
- **Supersedes:** —

## Context and problem statement

CU-14 sends WhatsApp messages to patients when an appointment is created, moved or cancelled,
before the appointment (reminder), and with the link of a virtual consultation (CU-15). The
result of every attempt must be recorded, a failure is retried once, patients without a phone
are skipped, and the use case that triggered the message is never interrupted. The MVP only
logged the agenda events.

## Decision drivers

- Several modules send messages (agenda, virtual consultations).
- It must work locally without a WhatsApp Business account.
- The professional must be able to see what was sent.

## Considered options

1. A `notifications` module with a `WhatsAppGateway` port, a delivery log, a local outbox
   adapter and a Cloud API adapter.
2. Send directly from each module with the provider SDK.
3. A third-party messaging service (Twilio).

## Decision outcome

Chosen option: **1. A notifications module.**

- `NotificationCenter.sendWhatsApp({ professionalId, patientId, phone, topic, body })` (exposed
  through `index.ts`, ADR-0022) never throws for delivery problems.
  - Without a phone it records `skipped`.
  - Transient errors are retried once.
  - Permanent errors (invalid number, not a WhatsApp user) are not retried.
  - Every outcome is saved as a `Notification`.
- `GET /notifications?patientId=` exposes the log (the patient profile's "Messages" tab).
- Adapters, chosen with `WHATSAPP_PROVIDER`:
  - `local` (default): `LocalWhatsAppOutbox` writes the message to the log and records it like
    a real one. Numbers with fewer than 8 digits fail the way the real API does.
  - `cloud-api`: `WhatsAppCloudApiGateway` posts text messages to the Meta Graph API. It adds
    the country code `54` to local numbers and maps unknown-number error codes to permanent
    errors.
- The agenda's `AppointmentNotifier` is implemented by `WhatsAppAppointmentNotifier` (patient
  contact from the patients module). It replaces `LoggingAppointmentNotifier`. Reminders are a
  scheduled job (ADR-0026): appointments starting within 24 hours are claimed in a transaction
  and then messaged. Moving an appointment re-arms its reminder.
- Messages go out after the transaction that changed the agenda (ADR-0025).
- Dates are written in the practice time zone (`APP_TIMEZONE`, `DateTimeFormatter`).

### Consequences

- 👍 CU-14 works fully locally and is visible in the patient profile.
- 👍 A provider change is one adapter.
- 👎 The Cloud API only delivers free text inside the 24-hour customer window. Business-initiated
  messages (confirmations, reminders) need pre-approved templates in production: the adapter
  must switch to `type: "template"` once they are approved.
- 👎 Delivery receipts (webhooks) are not processed. "Sent" means accepted by the API.

## Enforcement

- `apps/api/test/integration/care-automation.http.test.ts` (sent, skipped, retried, failed,
  reminders once, re-armed after rescheduling, scoped by professional).
- `apps/api/test/unit/integrations.test.ts` (Cloud API request shape and error mapping).

## References

- `apps/api/src/modules/notifications/`,
  <https://developers.facebook.com/docs/whatsapp/cloud-api/>
