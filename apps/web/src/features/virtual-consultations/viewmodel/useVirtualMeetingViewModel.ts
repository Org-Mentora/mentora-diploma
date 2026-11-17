import { useMemo, useState } from 'react';
import { ApiErrorAdapter } from '@/model/api/ApiErrorAdapter';
import {
  useListVirtualMeetingsQuery,
  useStartVirtualMeetingMutation,
} from '@/model/api/generated/mentoraApi';
import {
  VirtualMeetingAdapter,
  type VirtualMeetingItem,
} from '@/model/domain/virtual-consultations/VirtualMeetingAdapter';
import { useBrowserActions, useUserFeedback } from '@/model/platform/Platform';

export type { VirtualMeetingItem };

export interface VirtualMeetingViewModel {
  existing: VirtualMeetingItem | null;
  started: VirtualMeetingItem | null;
  isStarting: boolean;
  start: () => Promise<void>;
  close: () => void;
  copyLink: (url: string) => Promise<void>;
}

interface Options {
  patientId: string;
  appointmentId?: string | undefined;
}

// ViewModel
export function useVirtualMeetingViewModel({
  patientId,
  appointmentId,
}: Options): VirtualMeetingViewModel {
  const feedback = useUserFeedback();
  const browser = useBrowserActions();
  const { data } = useListVirtualMeetingsQuery(
    { appointmentId: appointmentId ?? '' },
    { skip: !appointmentId },
  );
  const [startMeeting, { isLoading }] = useStartVirtualMeetingMutation();
  const [started, setStarted] = useState<VirtualMeetingItem | null>(null);
  const existing = useMemo(
    () => (data?.[0] ? VirtualMeetingAdapter.toItem(data[0]) : null),
    [data],
  );

  return {
    existing,
    started,
    isStarting: isLoading,
    start: async () => {
      try {
        const meeting = await startMeeting({
          startVirtualMeetingRequestDto: { patientId, ...(appointmentId ? { appointmentId } : {}) },
        }).unwrap();
        setStarted(VirtualMeetingAdapter.toItem(meeting));
      } catch (caught) {
        feedback.error(
          ApiErrorAdapter.toUiError(caught)?.message ?? 'The video call could not be created',
        );
      }
    },
    close: () => setStarted(null),
    copyLink: async (url) => {
      await browser.copyText(url);
      feedback.success('Link copied');
    },
  };
}
