# ADR-0022: Cross-module collaboration through Model-owned abstractions

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** Mentora team
- **Tags:** backend, architecture
- **Supersedes:** —

## Context and problem statement

Some modules need data owned by others:
- the clinical record must check that the patient exists and resolve DSM-5 codes;
- the agenda shows patient names.

Direct imports of another module's repositories or entities would couple the Models and break
module isolation ([ADR-0004](0004-backend-mvp-passive-view.md)).

## Decision drivers

- A Model must not depend on another module's internals.
- Each module stays testable with fakes.
- Wiring stays in composition roots.

## Considered options

1. Owner modules expose small **query services** through their `index.ts`. Consumer Models
   declare their own abstract collaborator, implemented by an **adapter** in the consumer's
   `infrastructure/`.
2. Share repositories between modules
3. Domain events / messaging

## Decision outcome

Chosen option: **query services + consumer-owned abstractions + adapters.**

| Consumer Model abstraction | Adapter (consumer `infrastructure/`) | Owner query service (`#modules/...`) |
| --- | --- | --- |
| `clinical-records/PatientLookup` | `PatientDirectoryLookup` | `patients/PatientDirectory` |
| `clinical-records/DiagnosisResolver` | `CatalogDiagnosisResolver` | `diagnosis-catalog/DiagnosisCatalog` |
| `appointments/PatientNames` | `PatientDirectoryNames` | `patients/PatientDirectory` |

- Query services return plain data (ids, names, existence), never aggregates to mutate.
- `src/app/modules.ts` builds the owner module first and passes its query service
  (`patients.directory`, `diagnoses.catalog`) into the consumer module's constructor.
- Adapters import only `#modules/<name>`, the public index. Deep imports are impossible by
  construction ([ADR-0003](0003-typescript-esm-node24.md)).

### Consequences

- 👍 Consumers can be tested with an in-memory fake of their own abstraction.
- 👎 One more small class per dependency.

## Enforcement

Biome forbids `../../**` inside modules and forbids the model importing infrastructure;
`#modules/*` resolves only to `index.ts`.

## References

- `apps/api/src/app/modules.ts`, `apps/api/src/modules/*/infrastructure/*Lookup*.ts`
