# Web (apps/web): MVVM + RTK Query + Tailwind/shadcn

ADRs: 0010 (codegen), 0011 (MVVM), 0012 (Tailwind/shadcn), 0006 (AppStore singleton).
Reference slice to copy: `src/features/health`. Recipe: `.claude/skills/new-frontend-feature`.

## Layout

```
src/app/                    AppStore (singleton), AppProviders, router.tsx, RootLayout
src/model/api/              baseApi.ts, generated/mentoraApi.ts (DO NOT EDIT), ApiErrorAdapter
src/model/domain/<f>/       DTO → UI model adapters (formatting and client rules)
src/features/<f>/viewmodel/ use<Name>ViewModel.ts → { state, commands }
src/features/<f>/view/      <Name>Page.tsx + feature components (JSX only)
src/features/<f>/index.ts   public API (pages)
src/shared/ui | lib         shadcn components, cn()
```

## Layer rules (lint-enforced)

- **View:** calls one ViewModel hook and renders with `@/shared/ui`. It must not import
  `@/model/**`, `@reduxjs/toolkit`, `react-redux` or `@mentora/contracts`, and must not call `fetch`.
- **ViewModel:** uses generated hooks (`@/model/api/generated/mentoraApi`) + adapters, and returns
  UI models (never DTOs). No views, no `@/shared/ui`, no `baseApi`.
- **Model:** no React components, no features/app/shared-ui imports.
- **shared:** generic only. It must not import features, model or app.
- **Cross-feature:** only `@/features/<name>` (index).

## Workflow

1. API changed? Run `pnpm codegen` at the root.
2. Write the adapter in `model/domain`, then the ViewModel, then the View. Add the route in
   `app/router.tsx`.
3. Add a new shadcn component with `pnpm dlx shadcn@latest add <name>` (lands in `src/shared/ui`).
4. Tests: mock the generated hooks for ViewModel tests; mock the ViewModel for View tests.
