# ADR-0031: Video calls through a link provider port (Jitsi locally, Google Meet optional)

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** backend, integration
- **Supersedes:** —

## Context and problem statement

CU-15 creates a video call for a virtual consultation, sends the link to the patient (CU-14),
associates it with the appointment and keeps a history per patient. The specification names
Google Meet. Creating Meet links needs a Google account with Calendar API access and OAuth
credentials, which the local environment does not have.

## Decision drivers

- It must work locally without accounts.
- Google Meet must remain possible, as the specification asks.
- A platform failure must be reported so the professional can retry (step 2 alternative).

## Considered options

1. A `MeetingLinkProvider` port with a Jitsi adapter (default) and a Google Meet adapter.
2. Google Meet only.
3. Store a link pasted by the professional.

## Decision outcome

Chosen option: **1. A provider port with two adapters**, selected with `MEETING_PROVIDER`:

- `jitsi` (default): `JitsiMeetingLinkProvider` builds `https://meet.jit.si/Mentora-<24 hex>`.
  Jitsi rooms exist as soon as someone opens them, so no account is needed. The name is
  random, so it cannot be guessed.
- `google-meet`: `GoogleMeetLinkProvider` refreshes an OAuth token
  (`GOOGLE_CLIENT_ID`/`SECRET`/`REFRESH_TOKEN`), creates a Calendar event with
  `conferenceData.createRequest` (`hangoutsMeet`) and returns its `hangoutLink`.
- The new `virtual-consultations` module owns `VirtualMeeting`:
  - The meeting belongs to the patient and, optionally, to a scheduled virtual appointment.
  - Starting twice for the same appointment returns the same meeting.
  - The link goes to the patient through `NotificationCenter` (WhatsApp), and the result is
    stored on the meeting.
  - A provider failure answers `503 MEETING_PROVIDER_UNAVAILABLE` and nothing is stored.
- The SPA opens the call from a dialog with a real link (popup blockers do not block it) and a
  "copy link" button for manual sharing (step 5 alternative).

### Consequences

- 👍 CU-15 works locally end to end; switching to Meet is configuration.
- 👎 The Google adapter is only tested with a mocked `fetch`; it needs a real Google project to
  be verified.
- 👎 Jitsi's public server has no waiting room or account control; a self-hosted Jitsi
  (`JITSI_BASE_URL`) or Meet is preferable in production.

## Enforcement

- `apps/api/test/integration/care-automation.http.test.ts` (link, invitation, reuse,
  in-person rejected, ownership).
- `apps/api/test/unit/integrations.test.ts` (Jitsi format, Google request, 503 on failure).

## References

- `apps/api/src/modules/virtual-consultations/`,
  <https://developers.google.com/calendar/api/guides/create-events#conferencing>
