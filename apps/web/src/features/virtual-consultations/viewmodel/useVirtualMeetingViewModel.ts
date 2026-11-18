import { useMemo, useState } from 'react';
import {
  useListVirtualMeetingsQuery,
  useStartVirtualMeetingMutation,
} from '@/model/api/generated/mentoraApi';
import { useAction } from '@/model/api/useAction';
import {
  VirtualMeetingAdapter,
  type VirtualMeetingItem,
} from '@/model/domain/virtual-consultations/VirtualMeetingAdapter';
import { useBrowserActions, useUserFeedback } from '@/model/platform/Platform';
import { useTranslation } from '@/shared/i18n';

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
  const { t } = useTranslation();
  const feedback = useUserFeedback();
  const run = useAction();
  const browser = useBrowserActions();
  const { data } = useListVirtualMeetingsQuery(
    { appointmentId: appointmentId ?? '' },
    { skip: !appointmentId },
  );
  const [startMeeting, { isLoading }] = useStartVirtualMeetingMutation();
  const [started, setStarted] = useState<VirtualMeetingItem | null>(null);
  const existing = useMemo(
    () => (data?.items[0] ? VirtualMeetingAdapter.toItem(data.items[0]) : null),
    [data],
  );

  return {
    existing,
    started,
    isStarting: isLoading,
    start: async () => {
      const request = { patientId, ...(appointmentId ? { appointmentId } : {}) };
      const meeting = await run(
        () => startMeeting({ startVirtualMeetingRequestDto: request }).unwrap(),
        { failure: t('meetings.createFailed') },
      );
      if (meeting) {
        setStarted(VirtualMeetingAdapter.toItem(meeting));
      }
    },
    close: () => setStarted(null),
    copyLink: async (url) => {
      await browser.copyText(url);
      feedback.success(t('meetings.linkCopied'));
    },
  };
}
