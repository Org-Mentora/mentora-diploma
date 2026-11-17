import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ApiErrorAdapter } from '@/model/api/ApiErrorAdapter';
import {
  useListVirtualMeetingsQuery,
  useStartVirtualMeetingMutation,
} from '@/model/api/generated/mentoraApi';
import {
  VirtualMeetingAdapter,
  type VirtualMeetingItem,
} from '@/model/domain/virtual-consultations/VirtualMeetingAdapter';

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
        toast.error(
          ApiErrorAdapter.toUiError(caught)?.message ?? 'The video call could not be created',
        );
      }
    },
    close: () => setStarted(null),
    copyLink: async (url) => {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    },
  };
}
