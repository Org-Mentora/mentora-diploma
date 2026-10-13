# Add a frontend feature (MVVM)

Example: a "mentors list" screen. Copy `apps/web/src/features/health`. Agents can follow
`.claude/skills/new-frontend-feature`.

## 0. Make sure the API exists and is generated

```bash
pnpm codegen
```

You should now have `useListMentorsQuery` in `src/model/api/generated/mentoraApi.ts` and
`MentorDto` in `@mentora/contracts`. **Never** write endpoints or DTO types by hand.

## 1. Model adapter (`src/model/domain/mentors/MentorAdapter.ts`)

```ts
import type { MentorDto } from '@mentora/contracts';
export interface MentorUiModel { id: string; displayName: string; initials: string }
export class MentorAdapter {
  static toUiModel(dto: MentorDto): MentorUiModel { /* formatting lives here */ }
}
```

## 2. ViewModel (`src/features/mentors/viewmodel/useMentorListViewModel.ts`)

```ts
export interface MentorListViewModel {
  mentors: MentorUiModel[]; isLoading: boolean; error: UiError | null; refresh: () => void;
}
export function useMentorListViewModel(): MentorListViewModel {
  const { data, error, isLoading, refetch } = useListMentorsQuery();
  /* adapt + expose commands */
}
```

Mutations follow the same pattern. Expose `submit(values)`, `isSubmitting` and `submitError`;
the View never calls `useXxxMutation` directly.

## 3. View (`src/features/mentors/view/MentorListPage.tsx`)

- Call `useMentorListViewModel()` once and render with `@/shared/ui` components.
- Add missing shadcn components with `pnpm dlx shadcn@latest add <name>` (from `apps/web`).

## 4. Public API and route

- `src/features/mentors/index.ts`: `export { MentorListPage } from './view/MentorListPage';`
- Register the route in `src/app/router.tsx`.

## 5. Tests

- `MentorAdapter.test.ts` (fixtures)
- `useMentorListViewModel.test.ts` (`vi.mock('@/model/api/generated/mentoraApi')`)
- `MentorListPage.test.tsx` (`vi.mock('../viewmodel/useMentorListViewModel')`)

Run `pnpm lint && pnpm typecheck && pnpm test`.
