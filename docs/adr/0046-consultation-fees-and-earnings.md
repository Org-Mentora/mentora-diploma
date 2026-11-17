# ADR-0046: Consultation fees and earnings report

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** backend, frontend, data
- **Supersedes:** —

## Context and problem statement

The requirements ask for a chart of earnings by consultation cost. Appointments had no price,
so the agenda could not answer how much a month earned or will earn. Prices change over time,
and a report must not rewrite the past when a fee changes.

## Decision drivers

- Historical correctness: an appointment keeps the fee it was given.
- The professional sets a default fee per consultation type and can override it per
  appointment.
- Months are calendar months in the practice timezone.
- No charting library for one chart.

## Considered options

1. Compute earnings from the current fee table.
2. Copy the fee onto each appointment when it is scheduled, and aggregate the appointments.
3. Record income in a separate ledger.

## Decision outcome

Chosen option: **2**. Option 1 rewrites history. Option 3 is a billing product of its own.

- **Fee on the appointment.** `Appointment` gains `fee: number | null`, validated as positive
  and at most `MAX_FEE`. It also gains `source: 'agenda' | 'online'`.
  - When scheduling, an undefined fee takes `ConsultationFees.feeFor(type)`.
  - When rescheduling, an undefined fee keeps the current one.
- **Fee table.** `ConsultationFees` is one document per professional, in ARS. It is managed with
  `GET/PUT /appointments/fees` and audited as `fees.updated`.
- **Report.** `GET /appointments/earnings?from=YYYY-MM&to=YYYY-MM` covers at most 24 months.
  `MongooseAppointmentRepository.earnings` groups non-cancelled appointments by
  `$dateToString` in `APP_TIMEZONE`. `EarningsCalculator` splits each month into **earned**
  (already started) and **projected** (future), per consultation type. It also counts
  appointments without a fee.
- **Web.** `/reports` shows:
  - stat tiles;
  - a stacked monthly bar chart built with HTML and CSS: earned in blue `--chart-earned`,
    projected in orange `--chart-projected`, a palette validated for CVD and contrast in light
    and dark mode;
  - tooltips on hover and focus, a legend and a table view;
  - a breakdown by type.

  Fees are edited in `/settings/fees` and per appointment in the appointment dialog.

### Consequences

- 👍 Reports reflect what was agreed at the time, even after fee changes.
- 👍 There is no new dependency, and the chart follows the theme tokens.
- 👎 "Earned" means held and not cancelled, not paid. Payment tracking per appointment is out of
  scope.
- 👎 Appointments created before this change have `fee: null` and count as "without fee".

## Enforcement

- Unit tests in `appointment-model` cover fee validation and inheritance.
- `booking.http.test.ts` checks the fees and the monthly split.
- `EarningsAdapter.test.ts` checks the chart scaling.
- The contract (`EarningsReportDto`) is generated and CI-checked (ADR-0010).

## References

- `apps/api/src/modules/appointments/model/{ConsultationFees,EarningsReport,EarningsService}.ts`
- `apps/web/src/features/reports/`
