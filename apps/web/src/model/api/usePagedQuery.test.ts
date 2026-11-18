import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { type CursorPage, usePagedQuery } from './usePagedQuery';

const PAGES: Record<string, CursorPage<number>> = {
  first: { items: [1, 2], nextCursor: 'c2' },
  c2: { items: [3, 4], nextCursor: 'c3' },
  c3: { items: [5], nextCursor: null },
};

const cache = new Map<string, CursorPage<number>>();

function useFakeQuery(args: { q?: string; cursor?: string }) {
  const page = PAGES[args.cursor ?? 'first'];
  const key = JSON.stringify(args);
  if (page && !cache.has(key)) {
    cache.set(key, page);
  }
  return {
    currentData: cache.get(key),
    isFetching: false,
    isError: false,
    error: undefined,
    refetch: () => undefined,
  };
}

describe('usePagedQuery (ADR-0048)', () => {
  it('appends the next page when asked and stops on the last one', async () => {
    const { result } = renderHook(() => usePagedQuery(useFakeQuery, {}));

    await waitFor(() => expect(result.current.items).toEqual([1, 2]));
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items).toEqual([1, 2, 3, 4]));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items).toEqual([1, 2, 3, 4, 5]));
    expect(result.current.hasMore).toBe(false);
  });

  it('follows every cursor on its own with loadAll', async () => {
    const { result } = renderHook(() => usePagedQuery(useFakeQuery, {}, { loadAll: true }));

    await waitFor(() => expect(result.current.items).toEqual([1, 2, 3, 4, 5]));
    expect(result.current.hasMore).toBe(false);
  });

  it('starts again from the first page when the filters change', async () => {
    const { result, rerender } = renderHook(({ q }) => usePagedQuery(useFakeQuery, { q }), {
      initialProps: { q: 'a' },
    });
    await waitFor(() => expect(result.current.items).toEqual([1, 2]));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items).toHaveLength(4));

    rerender({ q: 'b' });
    await waitFor(() => expect(result.current.items).toEqual([1, 2]));
  });
});
