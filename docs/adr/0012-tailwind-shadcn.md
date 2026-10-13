# ADR-0012: Tailwind CSS v4 and shadcn/ui

- **Status:** Accepted
- **Date:** 2026-10-13
- **Deciders:** Mentora team
- **Tags:** frontend
- **Supersedes:** —

## Context and problem statement

We need a styling approach and component base that is modern, accessible, and leaves views as
simple markup.

## Decision drivers

- Fast iteration without context switching to CSS files.
- Own the component code (no black-box library upgrades).
- Accessible primitives.

## Considered options

1. Tailwind CSS v4 + shadcn/ui
2. MUI
3. CSS Modules

## Decision outcome

Chosen option: **Tailwind CSS v4 (Vite plugin, CSS-first config) + shadcn/ui.**

- Theme tokens are CSS variables in `apps/web/src/index.css` (`@theme inline`), with a `.dark`
  variant ready.
- shadcn components live in `apps/web/src/shared/ui` (configured in `components.json`).
  Add new ones with `pnpm dlx shadcn@latest add <component>` from `apps/web`.
- Components in `shared/ui` are generic: no feature imports, no data access.
- Use `cn()` from `@/shared/lib/utils` to merge classes.

### Consequences

- 👍 Consistent design tokens; components are editable source code.
- 👎 Long class strings in markup; extract feature components when a View grows.

## Enforcement

Biome rules for `shared/**` ([ADR-0011](0011-frontend-mvvm.md)); the Biome CSS parser has
`tailwindDirectives` enabled.

## References

- <https://tailwindcss.com/docs> · <https://ui.shadcn.com>
