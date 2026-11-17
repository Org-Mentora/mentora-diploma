import { useMemo } from 'react';
import { useListVirtualMeetingsQuery } from '@/model/api/generated/mentoraApi';
import {
  VirtualMeetingAdapter,
  type VirtualMeetingItem,
} from '@/model/domain/virtual-consultations/VirtualMeetingAdapter';

export type { VirtualMeetingItem };

// ViewModel
export function useVirtualMeetingHistoryViewModel(patientId: string) {
  const { data, isLoading } = useListVirtualMeetingsQuery({ patientId });
  const items = useMemo(() => (data ?? []).map(VirtualMeetingAdapter.toItem), [data]);
  return { items, isLoading };
}
