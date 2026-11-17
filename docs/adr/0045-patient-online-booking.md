# ADR-0045: Patient online booking

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** backend, frontend, domain
- **Supersedes:** —

## Context and problem statement

The requirements ask that patients can create their own appointments. Until now only the
professional scheduled them (CU-10/11). Patients have no account. Booking must respect the
agenda (no overlaps, ADR-0040 lock), the professional's working hours and their subscription
access. It must also resist abuse from an anonymous public endpoint.

## Decision drivers

- No patient accounts or passwords.
- The professional keeps control of the agenda.
- Reuse the patient and appointment use cases instead of duplicating their rules.
- Times are meaningful in the practice timezone, whatever the browser's.

## Considered options

1. Patients book directly into the agenda.
2. Patients send a request for a free slot, and the professional accepts or rejects it.
3. An external scheduling service (Calendly-like).

## Decision outcome

Chosen option: **2**. Option 1 lets strangers fill the agenda with fake patients. Option 3 adds
a vendor, a cost and a second source of truth.

- **Module.** A new `booking` module with two aggregates:
  - `BookingPage`, one per professional. It holds `enabled`, the slug, the slot length, the
    minimum notice, the horizon, the modalities, the weekly hours and the instructions.
  - `BookingRequest`, with the requester data and the states `pending` → `accepted`,
    `rejected` or `expired`.
- **Slots.** `SlotPlanner` (Strategy) builds the free slots from the weekly hours, interpreted
  in `APP_TIMEZONE` through `IntlLocalCalendar`. It removes busy intervals: appointments and
  pending requests.
- **Public API** (`/booking/public/{slug}`, no session):
  - page, slots (up to 14 days per call) and request creation;
  - rate limits through ADR-0040: 5 requests per hour per IP and 120 reads per 15 minutes;
  - a honeypot field;
  - at most 2 pending requests per DNI;
  - the page answers 404 when it is disabled or the professional has no access.
- **Acceptance.** Accepting runs in one transaction (ADR-0033):
  - it finds the patient by DNI or registers one through `patients.intake`;
  - it books the appointment through `appointments.booking`, with `source: 'online'` and the
    configured fee;
  - it stores the decision.

  The WhatsApp or email confirmation goes out after commit. Rejection emails the requester.
- **Cross-module ports** (ADR-0022): `PracticeDirectory`, `PatientRegistry`, `AgendaBooking`
  and `BookingNotifier`.
- **Expiry.** The hourly job `booking.expire-requests` expires requests whose time has passed.
- **Web.**
  - `/book/:slug` is a public page with week navigation, slots, a form and a receipt.
  - `/settings/booking` is the configuration and the shareable link.
  - The agenda shows a request panel with accept (consultation type) and reject (reason).
  - Online appointments carry a badge.
- **Concurrency.** Two requests for the same slot can both be pending. Accepting the second one
  fails with 409, because of the agenda lock and the overlap check.

### Consequences

- 👍 Patients book without accounts, and the professional decides.
- 👍 Patient and appointment rules live in their own modules. Booking only orchestrates.
- 👎 A requested slot is held only while the request is pending, so it can be lost to a
  concurrent request. The UI refreshes the slots on 409.
- 👎 The public endpoint is abuse-prone. It is mitigated by rate limits, a honeypot, the
  pending cap and the professional's review.

## Enforcement

- Biome keeps the booking model free of other modules (`../../**`) and of infrastructure.
- `test/unit/booking-model.test.ts` covers the slot planning, the overlaps, the settings
  validation and the request state machine.
- `test/integration/booking.http.test.ts` covers the public flow, acceptance, rejection, the
  limits and the audit trail.

## References

- `apps/api/src/modules/booking/`, `apps/web/src/features/booking/`
- ADR-0019, ADR-0022, ADR-0026, ADR-0033, ADR-0040
