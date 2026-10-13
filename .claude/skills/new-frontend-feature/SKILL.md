---
name: new-frontend-feature
description: Add a new screen or feature to apps/web following MVVM (generated RTK Query hooks + DTO→UI adapters in model, a use<Name>ViewModel hook, and a pure View built with shadcn/ui). Use for any new page, form or UI flow that consumes the API.
---

# New frontend feature (MVVM)

Read first: `apps/web/CLAUDE.md`, `docs/guides/add-frontend-feature.md`. Copy patterns from
`apps/web/src/features/health`.

## Checklist (in this order)

1. **API first.** The endpoint must exist in the API contracts. Run `pnpm codegen` at the root
   and confirm the hook (`useXxxQuery` / `useXxxMutation`) exists in
   `src/model/api/generated/mentoraApi.ts`. Never write fetch calls, endpoints or DTO types by hand.
2. **Adapter** `src/model/domain/<feature>/<Name>Adapter.ts`: a class with static
   `toUiModel(dto)` that turns DTOs from `@mentora/contracts` into `<Name>UiModel` (labels, dates,
   tones). Add `ApiErrorAdapter` usage for errors.
3. **ViewModel** `src/features/<feature>/viewmodel/use<Name>ViewModel.ts`:
   - export an `interface <Name>ViewModel { ...state; ...commands }`;
   - call generated hooks, adapt with the adapter, and return UI models and commands
     (`refresh`, `submit`, `select`...). Never return DTOs or JSX.
4. **View** `src/features/<feature>/view/<Name>Page.tsx`: call the ViewModel hook once and
   render using `@/shared/ui`. Event handlers call ViewModel commands. Missing shadcn component?
   Run `pnpm dlx shadcn@latest add <component>` from `apps/web`.
5. **Public API + route:** `src/features/<feature>/index.ts` exports the page. Add the route in
   `src/app/router.tsx`.
6. **Tests:**
   - `<Name>Adapter.test.ts` with DTO fixtures;
   - `use<Name>ViewModel.test.ts` with `vi.mock('@/model/api/generated/mentoraApi')` + `renderHook`;
   - `<Name>Page.test.tsx` with `vi.mock('../viewmodel/use<Name>ViewModel')` + Testing Library.
7. Run `pnpm lint && pnpm typecheck && pnpm test`. On `[arch][MVVM]` errors, move the logic to
   the right layer instead of disabling the rule.
