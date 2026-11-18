# Web (apps/web): MVVM + RTK Query + Tailwind/shadcn

ADRs: 0010 (codegen), 0011 (MVVM), 0012 (Tailwind/shadcn), 0006 (AppStore singleton), 0042 (platform ports),
0047 (i18n), 0048 (cursor pagination).
Reference slice to copy: `src/features/health`. Recipe: `.claude/skills/new-frontend-feature`.

## Layout

```
src/app/                    AppStore (singleton), AppProviders, router.tsx, RootLayout
src/model/api/              baseApi.ts, generated/mentoraApi.ts (DO NOT EDIT), ApiErrorAdapter
src/model/domain/<f>/       DTO → UI model adapters (formatting and client rules)
src/model/platform/         UserFeedback + BrowserActions ports, adapters and PlatformContext
src/features/<f>/viewmodel/ use<Name>ViewModel.ts → { state, commands }
src/features/<f>/view/      <Name>Page.tsx + feature components (JSX only)
src/features/<f>/index.ts   public API (pages)
src/shared/ui | lib         shadcn components, cn()
src/shared/i18n/            i18next adapter, locales/en.ts + es.ts (es typed as `typeof en`)
```

## Layer rules (lint-enforced)

- **View:** calls one ViewModel hook and renders with `@/shared/ui`. It must not import
  `@/model/**`, `@reduxjs/toolkit`, `react-redux` or `@mentora/contracts`, and must not call `fetch`.
- **ViewModel:** uses generated hooks (`@/model/api/generated/mentoraApi`) + adapters, and returns
  UI models (never DTOs). No views, no `@/shared/ui`, no `baseApi`.
- **Model:** no React components, no features/app/shared-ui imports.
- **shared:** generic only. It must not import features, model or app.
- **Cross-feature:** only `@/features/<name>` (index).

## Forms and session

- Forms (ADR-0021): zod schema + mapper in `model/domain/<f>/*.form.ts`; the ViewModel owns `useForm`
  and maps API `error.field` to `form.setError`. Re-export form types from the ViewModel for sub-views.
- Session: `features/session` (`RequireLogin` any session, `RequireSession` with access, `PublicOnly`,
  `AppShell`). Without access only `/settings/*` works (CU-01 step 7, CU-18). Logout resets the RTK cache.
- `baseApi` refetches `/auth/me` on `403 SUBSCRIPTION_INACTIVE` (refreshes the cookie, ADR-0029).
- Third-party engines (jsPDF) live in `model/domain` adapters, loaded with `import()` by ViewModels (ADR-0032).
- Confirmations: `ConfirmDialog` from `@/shared/ui/confirm-dialog`.
- Lists (ADR-0048): `usePagedQuery(useXxxQuery, filters)` from `@/model/api/usePagedQuery` → `items`, `hasMore`,
  `loadMore`, `refresh`; Views render `<LoadMore>` from `@/shared/ui/load-more`. Call `refresh()` after a mutation
  that changes the list. Use `loadAll` only for bounded ranges (agenda month).
- Toasts, printing and the clipboard (ADR-0042): ViewModels call `useUserFeedback()` / `useBrowserActions()`
  from `@/model/platform/Platform`, never `sonner`, `window` or `navigator`. `AppProviders` provides the
  browser implementation; tests wrap the hook in `<PlatformContext value={fake}>`.

## Texts (ADR-0047)

- Never hard-code user-facing text. Views and ViewModels use `useTranslation()` from `@/shared/i18n`;
  Model adapters use `translate` and `Formats` (dates, money in the selected language).
- Add every key to `locales/en.ts` **and** `locales/es.ts` (the typecheck fails otherwise). Plurals use
  `_one` / `_other`. zod messages are keys (`'validation.required'`); `FormField` translates them.
- New fixed API error messages: add the Spanish text to `shared/i18n/serverMessages.ts`.

## Workflow

1. API changed? Run `pnpm codegen` at the root.
2. Write the adapter in `model/domain`, then the ViewModel, then the View. Add the route in
   `app/router.tsx`.
3. Add a new shadcn component with `pnpm dlx shadcn@latest add <name>` (lands in `src/shared/ui`).
4. Tests: mock the generated hooks for ViewModel tests; mock the ViewModel for View tests.
5. Handle `429 TOO_MANY_REQUESTS` like any API error: show `error.message` (it says when to retry).
6. New model classes (adapters) appear in `docs/architecture/class-diagram.md`: run `pnpm docs:classes`.
