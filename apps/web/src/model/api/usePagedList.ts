import { useMemo, useRef } from 'react';
import { ApiErrorAdapter, type UiError } from './ApiErrorAdapter';
import {
  type CursorPage,
  type PagedList,
  type PagedQueryOptions,
  type PageQueryOptions,
  type PageQueryResult,
  usePagedQuery,
} from './usePagedQuery';

export interface UiPagedList<TItem> extends Omit<PagedList<TItem>, 'error'> {
  error: UiError | null;
}

export function usePagedList<A extends object, TDto, TItem>(
  useQuery: (args: A, options: PageQueryOptions) => PageQueryResult<CursorPage<TDto>>,
  args: A,
  toItems: (dtos: TDto[]) => TItem[],
  options?: Omit<PagedQueryOptions<CursorPage<TDto>, TDto>, 'select'>,
): UiPagedList<TItem> {
  const list = usePagedQuery(useQuery, args, options);
  const mapper = useRef(toItems);
  mapper.current = toItems;
  const items = useMemo(() => mapper.current(list.items), [list.items]);
  return { ...list, items, error: ApiErrorAdapter.toUiError(list.error) };
}
