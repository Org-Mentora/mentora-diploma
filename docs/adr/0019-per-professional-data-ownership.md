# ADR-0019: Per-professional data ownership

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** Mentora team
- **Tags:** backend, security
- **Supersedes:** —

## Context and problem statement

Each psychiatrist subscribes individually and manages their own patients, clinical records and
agenda. The class diagram has `Institucion` and `Consultorio`, but no use case in the MVP shares
data between professionals.

## Decision drivers

- Clinical data must never leak between professionals.
- Rules simple enough to apply in every repository.
- Room to add institutions later.

## Considered options

1. Every aggregate stores `professionalId`, and every query filters by it
2. One database per professional
3. Institution-level tenancy from day one

## Decision outcome

Chosen option: **row-level ownership by `professionalId`.**

- `Patient`, `ClinicalRecord` and `Appointment` store `professionalId`.
- Repository methods take `professionalId` explicitly (`findOwned`, `search`, `findByPatient`,
  and so on). There is no "find by id" path for these aggregates in use cases.
- A resource owned by someone else answers **404**, not 403, so it does not reveal that it exists.
- **DNI is unique per professional** (compound unique index `professionalId + dni`). Two
  professionals may treat the same person.
- Professionals are unique by email and by license number, globally.

### Consequences

- 👍 Isolation is visible in every repository signature.
- 👎 Sharing patients inside an institution will need a new ADR (an `institutionId` scope).

## Enforcement

The HTTP integration tests include a second professional that must get 404 or an empty list for
every resource.

## References

- `apps/api/src/modules/*/model/*Repository.ts`
