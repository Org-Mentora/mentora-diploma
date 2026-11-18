import { useMemo } from 'react';
import { useListVirtualMeetingsQuery } from '@/model/api/generated/mentoraApi';
import { usePagedQuery } from '@/model/api/usePagedQuery';
import {
  VirtualMeetingAdapter,
  type VirtualMeetingItem,
} from '@/model/domain/virtual-consultations/VirtualMeetingAdapter';

export type { VirtualMeetingItem };

// ViewModel
export function useVirtualMeetingHistoryViewModel(patientId: string) {
  const list = usePagedQuery(useListVirtualMeetingsQuery, { patientId });
  const items = useMemo(() => list.items.map(VirtualMeetingAdapter.toItem), [list.items]);
  return {
    items,
    isLoading: list.isLoading,
    hasMore: list.hasMore,
    isLoadingMore: list.isLoadingMore,
    loadMore: list.loadMore,
  };
}
