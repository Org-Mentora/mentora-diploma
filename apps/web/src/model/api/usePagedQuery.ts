import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface PageQueryOptions {
  skip?: boolean;
  pollingInterval?: number;
  refetchOnMountOrArgChange?: boolean;
}

interface PageQueryResult<P> {
  currentData?: P | undefined;
  isFetching: boolean;
  isError: boolean;
  error?: unknown;
  refetch: () => unknown;
}

export interface PagedQueryOptions<P, T> extends PageQueryOptions {
  select?: (data: P) => CursorPage<T>;
  loadAll?: boolean;
  keepPreviousItems?: boolean;
}

export interface PagedList<T> {
  items: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isFetching: boolean;
  hasMore: boolean;
  error: unknown;
  loadMore: () => void;
  refresh: () => void;
}

interface LoadedPage<T> {
  cursor: string | undefined;
  items: T[];
  nextCursor: string | null;
}

interface PagerState<T> {
  key: string;
  cursor: string | undefined;
  pages: LoadedPage<T>[];
  previous: LoadedPage<T>[];
}

const fresh = <T>(key: string, previous: LoadedPage<T>[] = []): PagerState<T> => ({
  key,
  cursor: undefined,
  pages: [],
  previous,
});

// Iterator
export function usePagedQuery<A extends object, P, T = P extends CursorPage<infer I> ? I : never>(
  useQuery: (args: A, options: PageQueryOptions) => PageQueryResult<P>,
  args: A,
  { select, loadAll = false, keepPreviousItems = false, ...options }: PagedQueryOptions<P, T> = {},
): PagedList<T> {
  const key = JSON.stringify(args);
  const [stored, setState] = useState<PagerState<T>>(() => fresh(key));
  const kept = stored.pages.length > 0 ? stored.pages : stored.previous;
  const state = stored.key === key ? stored : fresh<T>(key, keepPreviousItems ? kept : []);
  if (stored.key !== key) {
    setState(state);
  }

  const result = useQuery(state.cursor ? { ...args, cursor: state.cursor } : args, {
    refetchOnMountOrArgChange: true,
    ...options,
  });
  const { currentData, isFetching, isError, error, refetch } = result;
  const selectRef = useRef(select);
  selectRef.current = select;

  useEffect(() => {
    if (!currentData) {
      return;
    }
    const pick = selectRef.current;
    const page = pick ? pick(currentData) : (currentData as unknown as CursorPage<T>);
    setState((previous) => {
      if (previous.key !== key) {
        return previous;
      }
      const loaded = { cursor: previous.cursor, items: page.items, nextCursor: page.nextCursor };
      const index = previous.pages.findIndex((p) => p.cursor === previous.cursor);
      const pages =
        index === -1 ? [...previous.pages, loaded] : [...previous.pages.slice(0, index), loaded];
      return { ...previous, pages };
    });
  }, [currentData, key]);

  const last = state.pages.at(-1);
  const nextCursor = last?.nextCursor ?? null;
  const hasMore = nextCursor !== null;

  const loadMore = useCallback(() => {
    if (nextCursor && !isFetching) {
      setState((previous) => ({ ...previous, cursor: nextCursor }));
    }
  }, [nextCursor, isFetching]);

  useEffect(() => {
    if (loadAll && hasMore && !isFetching) {
      loadMore();
    }
  }, [loadAll, hasMore, isFetching, loadMore]);

  const shown = state.pages.length > 0 ? state.pages : state.previous;
  const items = useMemo(() => shown.flatMap((page) => page.items), [shown]);

  return {
    items,
    isLoading: !options.skip && shown.length === 0 && !isError,
    isFetching,
    isLoadingMore: isFetching && state.cursor !== undefined,
    hasMore: hasMore && !loadAll,
    error,
    loadMore,
    refresh: () => {
      if (state.cursor === undefined) {
        void refetch();
      } else {
        setState(fresh(key));
      }
    },
  };
}
