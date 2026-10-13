import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGetHealthQuery } from '@/model/api/generated/mentoraApi';
import { useHealthViewModel } from './useHealthViewModel';

vi.mock('@/model/api/generated/mentoraApi', () => ({ useGetHealthQuery: vi.fn() }));

const mockedQuery = vi.mocked(useGetHealthQuery);
const refetch = vi.fn();

function queryResult(overrides: Record<string, unknown>) {
  return {
    data: undefined,
    error: undefined,
    isLoading: false,
    isFetching: false,
    refetch,
    ...overrides,
  } as unknown as ReturnType<typeof useGetHealthQuery>;
}

describe('useHealthViewModel', () => {
  beforeEach(() => {
    refetch.mockReset();
  });

  it('exposes the adapted UI model when data arrives', () => {
    mockedQuery.mockReturnValue(
      queryResult({
        data: {
          status: 'ok',
          uptimeSeconds: 30,
          checkedAt: '2026-01-01T00:00:00.000Z',
          components: [],
        },
      }),
    );

    const { result } = renderHook(() => useHealthViewModel());

    expect(result.current.health?.label).toBe('All systems operational');
    expect(result.current.error).toBeNull();
  });

  it('adapts transport errors into a UiError', () => {
    mockedQuery.mockReturnValue(
      queryResult({ error: { status: 'FETCH_ERROR', error: 'offline' } }),
    );

    const { result } = renderHook(() => useHealthViewModel());

    expect(result.current.error).toEqual({
      code: 'NETWORK_ERROR',
      message: 'The server could not be reached',
    });
  });

  it('refresh() triggers a refetch', () => {
    mockedQuery.mockReturnValue(queryResult({}));

    const { result } = renderHook(() => useHealthViewModel());
    result.current.refresh();

    expect(refetch).toHaveBeenCalledOnce();
  });
});
