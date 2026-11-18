import { useListNotificationsQuery } from '@/model/api/generated/mentoraApi';
import { type UiPagedList, usePagedList } from '@/model/api/usePagedList';
import {
  NotificationAdapter,
  type NotificationItem,
} from '@/model/domain/notifications/NotificationAdapter';

export type { NotificationItem };

export type NotificationsViewModel = UiPagedList<NotificationItem>;

// ViewModel
export function useNotificationsViewModel(patientId: string): NotificationsViewModel {
  return usePagedList(
    useListNotificationsQuery,
    { patientId },
    (dtos) => dtos.map(NotificationAdapter.toItem),
    { pollingInterval: 60_000 },
  );
}
