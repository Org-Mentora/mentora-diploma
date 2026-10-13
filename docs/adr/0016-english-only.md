# ADR-0016: English for code and documentation

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** Mentora team
- **Tags:** process
- **Supersedes:** —

## Context and problem statement

Mixing languages in identifiers, comments and docs makes code harder to search and confuses
generated names (OpenAPI ids, hooks).

## Decision drivers

- Consistency between generated and hand-written code.
- Libraries, frameworks and agents work in English.

## Considered options

1. Everything in English
2. Docs in Spanish, code in English
3. Everything in Spanish

## Decision outcome

Chosen option: **English for all code, comments, commit messages, ADRs and docs.**

Domain terms from the use-case specification (CU) are translated once into a **glossary**
(`docs/architecture/glossary.md`, created with the domain model), and that translation is then
used consistently. User-facing UI copy may be localised later through i18n; it is not covered here.

### Consequences

- 👍 One vocabulary across code, API, generated types and docs.
- 👎 The use-case documents (in Spanish) need a mapping to English names.

## Enforcement

Code review.

## References

- —
