# ADR-0005: Object-oriented conventions for the backend

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** Mentora team
- **Tags:** backend
- **Supersedes:** —

## Context and problem statement

The course requires object-oriented programming in the backend. Without conventions, TypeScript
code drifts into a mix of loose functions and anemic objects.

## Decision drivers

- Encapsulated domain behaviour (no anemic models).
- Polymorphism through abstract classes so the Model owns its abstractions.
- Predictable naming for humans and agents.

## Considered options

1. Class-based OOP with abstract classes and constructor injection
2. Functional modules with closures
3. A DI container with decorators (tsyringe/inversify)

## Decision outcome

Chosen option: **class-based OOP with manual constructor injection.**

- **Entities** extend `Entity<Props>`: identity + behaviour methods, state in `props`, no public
  setters. Construction through static factories (`Mentor.create(...)`) that enforce invariants.
- **Value objects** extend `ValueObject<Props>`: immutable and compared by value.
- **Abstractions owned by the Model are `abstract class`es** (e.g. `Repository<T>`,
  `HealthIndicator`). Plain `interface`s are used for small structural contracts (`View`,
  `HttpResponder`, `AppLogger`).
- **Dependencies are constructor parameters**, typed with the abstraction. Wiring happens only in
  the module composition root (`<Name>Module.ts`). No DI container, no decorators.
- **Errors** extend `ApplicationError` (`ValidationError`, `NotFoundError`, `ConflictError`, ...).
  The Model throws them; views translate the `kind` to a transport status.
- **Naming:** one class per file, file named after the class (`GetMentorPresenter.ts`).
  Suffixes: `*Presenter`, `*HttpView`, `*Routes`, `*Module`, `*Service`, `*Repository`
  (abstract) / `Mongoose*Repository` (adapter), `*Mapper`, `*Adapter`.
- Private state uses `#private` fields or `private readonly` constructor parameters.

### Consequences

- 👍 The Model reads like the domain diagram.
- 👍 Explicit wiring is easy to follow and to fake in tests.
- 👎 Composition roots grow with the module; split factories if one gets large.

## Enforcement

Code review, `useImportType` and `noUnusedVariables` lint rules, and the
[new-backend-module skill](../../.claude/skills/new-backend-module/SKILL.md).

## References

- `apps/api/src/core/model/*`
