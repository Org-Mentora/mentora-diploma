import { useMemo } from 'react';
import { useListNotificationsQuery } from '@/model/api/generated/mentoraApi';
import {
  NotificationAdapter,
  type NotificationItem,
} from '@/model/domain/notifications/NotificationAdapter';

export type { NotificationItem };

export interface NotificationsViewModel {
  items: NotificationItem[];
  isLoading: boolean;
}

// ViewModel
export function useNotificationsViewModel(patientId: string): NotificationsViewModel {
  const { data, isLoading } = useListNotificationsQuery(
    { patientId },
    { pollingInterval: 60_000, refetchOnMountOrArgChange: true },
  );
  const items = useMemo(() => (data ?? []).map(NotificationAdapter.toItem), [data]);
  return { items, isLoading };
}
