# ADR-0029: Subscriptions module with a payment gateway port and a simulated gateway

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** backend, domain, security
- **Supersedes:** —

## Context and problem statement

CU-18 manages the professional's subscription: plans, cards, automatic debit, manual payments,
payment history, cancellation, and periodic billing with its failure states (pending payment,
suspended). Until now the subscription was a small value object inside the `Professional`
aggregate, with only a trial. Payments need an external processor, but the project runs
locally without accounts.

## Decision drivers

- Billing has its own rules and lifecycle; the auth module should not grow with them.
- Card numbers must not be stored (PCI).
- A retried database transaction must never charge twice (ADR-0025).
- Session tokens carry the access end date (ADR-0018): changes must reach them.

## Considered options

1. A `subscriptions` module that owns the subscription and payments, behind a
   `PaymentGateway` port, with a local simulated gateway.
2. Keep the subscription in auth and add billing there.
3. Integrate a real provider (Mercado Pago, Stripe) from the start.

## Decision outcome

Chosen option: **1. A separate `subscriptions` module with a simulated gateway.**

- **Aggregate.** `Subscription` uses `_id = professionalId` (one per professional) and stores
  a `phase` (`trial`, `active`, `pending_payment`, `suspended`, `expired`), the plan billed at
  the next renewal, the period end, auto-debit, the cards and a failed-charge counter.
  Cancellation is a mark (`cancelledAt`), not a phase, so resuming returns to exactly where
  the subscription was. `statusAt(now)` derives what the professional sees; access is "the
  period has not ended and the phase is `trial`/`active`".
- **Rules.**
  - Cancelling keeps the paid period.
  - Choosing a plan with access applies it at the next renewal; without access it charges now
    (`409 PAYMENT_METHOD_REQUIRED` without a card, `402 PAYMENT_DECLINED` if declined).
  - Removing the only automatic-debit card needs `?confirm=true`.
  - A payment extends access from the end of the current period, or from now if it already
    ended.
  - Three technical failures in a row suspend the subscription.
- **Charges outside transactions.** Every charge is decided in one transaction, sent to the
  gateway with an idempotency key (`renewal:<id>:<periodEnd>` for renewals), and its result is
  stored in a second transaction.
- **Gateway port.** `PaymentGateway.tokenizeCard/charge`. `SimulatedPaymentGateway` validates
  the Luhn check and CVC, detects the brand, honours idempotency keys and has sandbox-style
  test cards: `4242 4242 4242 4242` is approved, `4000 0000 0000 0002` is declined,
  `4000 0000 0000 9995` is declined for insufficient funds, and `4000 0000 0000 0119` fails
  technically. Only the brand, the last 4 digits, the expiry and the gateway token are stored.
- **Auth integration** (ADR-0022). Auth declares `ProfessionalAccess`, implemented over
  `SubscriptionAccess`:
  - CU-03 starts the trial in the same transaction as the account.
  - CU-16 updates the billing contact in the same transaction as the profile.
  - Sessions read the access state.
- **Session refresh.** `GET /auth/me` re-issues the session cookie with the current access,
  and the SPA refetches `/auth/me` on any `403 SUBSCRIPTION_INACTIVE`. Renewals and payments
  made after login therefore reach the guard without logging out. Billing endpoints only need
  a session (`requireSession`), so a professional without access can pay. This complements
  ADR-0018.
- **Migration.** `LegacySubscriptionMigration` (auth, on boot) copies the old embedded
  subscriptions into the new collection and removes them from the professionals. It is
  idempotent.
- Prices come from configuration (`PLAN_MONTHLY_PRICE`, `PLAN_ANNUAL_PRICE`, in ARS).

### Consequences

- 👍 CU-18 works end to end locally, including declines, technical failures and renewals.
- 👍 A real provider only needs a new `PaymentGateway` adapter.
- 👎 The API receives the card number to tokenize it (the simulated gateway cannot do it in the
  browser). A real provider must tokenize in the browser (e.g. Mercado Pago Bricks) so the
  API never sees the PAN. This is required before production.
- 👎 `GET /auth/me` now slides the session expiry (each call extends it).
- 👎 Manual payments are trusted as recorded (no reconciliation), as the specification
  describes.

## Enforcement

- `apps/api/test/integration/subscriptions.http.test.ts` (trial, renewals, declines,
  suspension, card confirmation, manual payment, cancellation, migration, PAN not stored).
- `apps/api/test/unit/subscription-model.test.ts` (state machine and simulated gateway).

## References

- `apps/api/src/modules/subscriptions/`, ADR-0018, ADR-0022, ADR-0025
