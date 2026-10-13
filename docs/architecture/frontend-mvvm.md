# Frontend architecture — MVVM

Decision: [ADR-0011](../adr/0011-frontend-mvvm.md). Codegen: [ADR-0010](../adr/0010-frontend-codegen.md).

## Roles

| Role | Lives in | Responsibility |
| --- | --- | --- |
| **Model** | `src/model` | Generated RTK Query API (`api/generated`), DTO types (`@mentora/contracts`), adapters DTO → UI model (`domain/<feature>`), transport error adapter |
| **ViewModel** | `src/features/<f>/viewmodel/use<Name>ViewModel.ts` | Hook returning `{ state, commands }`: calls generated hooks, adapts data, exposes intents (`refresh`, `submit`, ...) |
| **View** | `src/features/<f>/view/*.tsx` | Calls **one** ViewModel hook and renders with `shared/ui` components; forwards events to commands |

## Data flow

```
View ──calls──► ViewModel ──uses──► generated hook (RTK Query) ──HTTP──► API
  ▲                │
  └──UI model◄─────┘  (via model/domain adapters)
```

## Reference: the health feature

```ts
// viewmodel/useHealthViewModel.ts
export interface HealthViewModel {
  health: HealthUiModel | null; isLoading: boolean; isRefreshing: boolean;
  error: UiError | null; refresh: () => void;
}
export function useHealthViewModel(): HealthViewModel {
  const { data, error, isLoading, isFetching, refetch } = useGetHealthQuery();
  const health = useMemo(() => (data ? HealthAdapter.toUiModel(data) : null), [data]);
  return { health, isLoading, isRefreshing: isFetching && !isLoading,
           error: ApiErrorAdapter.toUiError(error), refresh: () => void refetch() };
}

// view/HealthPage.tsx
export function HealthPage() {
  const { health, error, refresh } = useHealthViewModel();
  return /* JSX only */;
}
```

## Conventions

- One ViewModel per page/screen. Extract sub-components into `view/` when the JSX grows.
  They receive props from the page and do not call ViewModels themselves.
- ViewModels expose **UI models**, not DTOs. Formatting (dates, labels, tones) lives in the
  `model/domain` adapters.
- Global client state (if ever needed beyond RTK Query cache) goes to a slice in `src/model`
  and is read by ViewModels.
- Routes are declared in `src/app/router.tsx`, which imports pages from `@/features/<name>`.
- The Redux store is the `AppStore` singleton. Tests use `AppStore.create()`.

## Testing

- View: `vi.mock('../viewmodel/useXViewModel')` and assert rendering/intents.
- ViewModel: `vi.mock('@/model/api/generated/mentoraApi')` + `renderHook`.
- Adapters: plain unit tests on DTO fixtures.
