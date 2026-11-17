# ADR-0033: Cross-module commands inside the caller's transaction

- **Status:** Accepted
- **Date:** 2026-11-17
- **Deciders:** Mentora team
- **Tags:** backend, patterns
- **Supersedes:** —

## Context and problem statement

ADR-0022 lets modules read each other through query services. New use cases also need to
*change* another module's data as part of their own operation:

- CU-09 → CU-07: registering a consultation updates the patient's last clinical activity, the
  date that drives the automatic inactivation.
- CU-03 → CU-18: registering a professional starts the subscription trial.
- CU-16 → CU-18: changing the profile email changes the billing contact.

If these changes are not atomic, the two modules can disagree. For example, a consultation
could be saved while the patient keeps an old date and is inactivated.

## Decision drivers

- Keep ADR-0022: no module touches another module's repositories or aggregates.
- Atomicity with the transaction ctx (ADR-0025).

## Considered options

1. Command services exposed in `index.ts`, called through the consumer's own port inside the
   consumer's transaction.
2. Domain events with an in-process bus (eventual consistency).
3. Denormalize by reading the other module at query time (CU-07 would query clinical records).

## Decision outcome

Chosen option: **1. Command services, same transaction.**

- The owner exposes a narrow command service in `index.ts`: `PatientActivity`
  (`recordClinicalActivity`) and `SubscriptionAccess` (`startTrial`, `updateContact`).
- The consumer declares its own port and an adapter in its `infrastructure/` (as in ADR-0022):
  `ClinicalActivityRecorder` → `PatientActivityRecorder`, and `ProfessionalAccess` →
  `SubscriptionAccessAdapter`.
- The call happens inside the consumer's `transactions.run`. Because both modules' repositories
  read the session from the same `TransactionContext`, the write joins the transaction.
- Commands are idempotent where possible: an older consultation date never moves the patient's
  date back. Data that existed before this ADR is backfilled on boot
  (`ClinicalActivityBackfill`, `LegacySubscriptionMigration`).
- Option 3 was rejected because the patients module would depend on clinical records, while
  clinical records already depends on patients (cycle).

### Consequences

- 👍 Cross-module invariants hold even under failures or retries.
- 👍 Dependencies stay one-way and explicit in `src/app/modules.ts`.
- 👎 Modules are coupled in time (synchronous call). If a consumer must not wait for another
  module, move to events with an outbox (new ADR).

## Enforcement

- Biome: modules only import `#modules/<name>` (ADR-0004).
- `apps/api/test/integration/care-automation.http.test.ts` (consultation keeps the patient
  active), `subscriptions.http.test.ts` (trial created with the account, contact follows the
  profile, migration).

## References

- ADR-0022, ADR-0025, `apps/api/src/modules/patients/model/PatientActivity.ts`
