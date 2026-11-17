import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useListVirtualMeetingsQuery,
  useStartVirtualMeetingMutation,
} from '@/model/api/generated/mentoraApi';
import { type Platform, PlatformContext } from '@/model/platform/Platform';
import { useVirtualMeetingViewModel } from './useVirtualMeetingViewModel';

vi.mock('@/model/api/generated/mentoraApi', () => ({
  useListVirtualMeetingsQuery: vi.fn(),
  useStartVirtualMeetingMutation: vi.fn(),
}));

const startMeeting = vi.fn();
const platform = {
  feedback: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  browser: {
    print: vi.fn(),
    copyText: vi.fn(() => Promise.resolve()),
    absoluteUrl: (path: string) => `http://localhost${path}`,
  },
} satisfies Platform;

const wrapper = ({ children }: { children: ReactNode }) => (
  <PlatformContext value={platform}>{children}</PlatformContext>
);

describe('useVirtualMeetingViewModel (CU-15) with an injected platform', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useListVirtualMeetingsQuery).mockReturnValue({ data: undefined } as never);
    vi.mocked(useStartVirtualMeetingMutation).mockReturnValue([
      startMeeting,
      { isLoading: false },
    ] as never);
  });

  it('copies the link through BrowserActions and confirms through UserFeedback', async () => {
    const { result } = renderHook(() => useVirtualMeetingViewModel({ patientId: 'p-1' }), {
      wrapper,
    });

    await act(() => result.current.copyLink('https://meet.jit.si/mentora-abc'));

    expect(platform.browser.copyText).toHaveBeenCalledWith('https://meet.jit.si/mentora-abc');
    expect(platform.feedback.success).toHaveBeenCalledWith('Link copied');
  });

  it('reports a failed start with the API message', async () => {
    startMeeting.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          status: 503,
          data: { error: { code: 'MEETING_PROVIDER_UNAVAILABLE', message: 'Jitsi is down' } },
        }),
    });
    const { result } = renderHook(() => useVirtualMeetingViewModel({ patientId: 'p-1' }), {
      wrapper,
    });

    await act(() => result.current.start());

    expect(platform.feedback.error).toHaveBeenCalledWith('Jitsi is down');
    expect(result.current.started).toBeNull();
  });
});
