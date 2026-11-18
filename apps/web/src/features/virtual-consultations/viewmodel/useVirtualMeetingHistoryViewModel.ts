import { useListVirtualMeetingsQuery } from '@/model/api/generated/mentoraApi';
import { type UiPagedList, usePagedList } from '@/model/api/usePagedList';
import {
  VirtualMeetingAdapter,
  type VirtualMeetingItem,
} from '@/model/domain/virtual-consultations/VirtualMeetingAdapter';

export type { VirtualMeetingItem };

// ViewModel
export function useVirtualMeetingHistoryViewModel(
  patientId: string,
): UiPagedList<VirtualMeetingItem> {
  return usePagedList(useListVirtualMeetingsQuery, { patientId }, (dtos) =>
    dtos.map(VirtualMeetingAdapter.toItem),
  );
}
