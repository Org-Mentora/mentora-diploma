# ADR-0021: Forms live in ViewModels (react-hook-form + zod)

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** Mentora team
- **Tags:** frontend
- **Supersedes:** —

## Context and problem statement

Most MVP screens are forms: register, login, patient, consultation and appointment. Form state,
validation and submission must fit MVVM ([ADR-0011](0011-frontend-mvvm.md)) without putting
logic in Views.

## Decision drivers

- Views stay declarative.
- Validation messages appear before the request; API errors land on the right field.
- Minimal re-renders on large forms (patient, consultation).

## Considered options

1. react-hook-form + zod resolver, owned by the ViewModel
2. Controlled inputs with `useState` per field
3. A form library inside each View

## Decision outcome

Chosen option: **react-hook-form + `@hookform/resolvers/zod`.**

- **Model** (`src/model/domain/<feature>/*.form.ts`):
  - a zod form schema whose values are **strings**, as inputs produce them;
  - defaults;
  - a mapper class (`PatientForm`, `ConsultationForm`, `AppointmentForm`, `AuthForms`) that
    converts between form values and contract DTOs. Dates become ISO strings, `''` becomes `null`.
- **ViewModel:** calls `useForm`/`useFieldArray` and exposes `form`, `submit`, `isSubmitting` and
  `error`. On API errors with `details.field` (409 duplicate DNI, overlapping slot, existing
  email) it calls `form.setError(field, ...)`. It owns side effects: navigation and toasts.
- **View:** binds inputs with `form.register(...)` and renders `formState.errors`. When a
  sub-view needs the form type, the ViewModel re-exports it, because Views cannot import
  `@/model/**`.

### Consequences

- 👍 One pattern for every form; client and server validation reported consistently.
- 👎 Form schemas duplicate part of the API contract, kept in sync by hand. The API remains the
  authority.

## Enforcement

The Biome MVVM rules apply: Views cannot import `@/model/**`. ViewModel tests cover the
submit flows.

## References

- `apps/web/src/model/domain/**/**.form.ts`, `apps/web/src/features/*/viewmodel/*`
