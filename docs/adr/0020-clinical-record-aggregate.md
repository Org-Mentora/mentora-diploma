# ADR-0020: Clinical record as an aggregate with embedded consultations

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** Mentora team
- **Tags:** backend, domain
- **Supersedes:** —

## Context and problem statement

The class diagram composes `HistoriaClinica` with `Diagnostico`, `NotaEvolucion` and
`Medicamento`. CU-09 registers a consultation together with its evolution (CU-09), diagnosis
(CU-11) and medications (CU-12). CU-11 and CU-12 require that **previous records are never
modified or deleted**.

## Decision drivers

- One consistency boundary per patient history.
- Append-only clinical data.
- Simple reads for CU-08 (whole history) and CU-11 step 10 (diagnosis history).

## Considered options

1. `ClinicalRecord` aggregate root with embedded `Consultation` entities; diagnosis and
   medication as value objects
2. Separate collections for consultations, diagnoses and medications
3. Event sourcing

## Decision outcome

Chosen option: **one aggregate per patient, stored as one MongoDB document** (`clinical_records`).

- `ClinicalRecord` (aggregate root) offers `addConsultation()`, `consultationsChronological()`,
  `diagnosisHistory()` and `findConsultation()`. There are no update or delete methods.
- `Consultation` (entity inside the aggregate) holds:
  - date, type (`in_person` | `virtual`), reason and observations;
  - `evolution` (the evolution note, optional);
  - an optional `AssignedDiagnosis`;
  - zero or more `Medication`s.
- `AssignedDiagnosis` (value object) stores the DSM-5 **code and name** copied from the catalog,
  plus `assignedAt`. The history keeps its meaning even if the catalog changes later.
- `Medication` (value object): name, dose, frequency and duration are required; indications are
  optional; it also records `prescribedAt`.
- To change a diagnosis, the professional registers a new consultation. The diagnosis history
  lists every consultation's diagnosis, newest consultation first.
- The record is created lazily with the first consultation. A patient with no consultations gets
  an empty record (CU-08 alternative flow).
- The DSM-5 catalog is a separate, read-only module (`diagnosis-catalog`), seeded at boot from
  `dsm5Seed.ts` with idempotent upserts.

### Consequences

- 👍 One read gets the whole history; invariants live in one class.
- 👎 The document grows with every consultation. MongoDB's 16 MB limit leaves room for thousands
  of consultations; split into a separate collection if that ever matters.

## Enforcement

Unit tests on `ClinicalRecord`; the model exposes no mutators for existing consultations.

## References

- `apps/api/src/modules/clinical-records/model/*`
