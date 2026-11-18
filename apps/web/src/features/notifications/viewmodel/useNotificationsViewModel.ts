import { useMemo } from 'react';
import { useListNotificationsQuery } from '@/model/api/generated/mentoraApi';
import { usePagedQuery } from '@/model/api/usePagedQuery';
import {
  NotificationAdapter,
  type NotificationItem,
} from '@/model/domain/notifications/NotificationAdapter';

export type { NotificationItem };

export interface NotificationsViewModel {
  items: NotificationItem[];
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
}

// ViewModel
export function useNotificationsViewModel(patientId: string): NotificationsViewModel {
  const list = usePagedQuery(useListNotificationsQuery, { patientId }, { pollingInterval: 60_000 });
  const items = useMemo(() => list.items.map(NotificationAdapter.toItem), [list.items]);
  return {
    items,
    isLoading: list.isLoading,
    hasMore: list.hasMore,
    isLoadingMore: list.isLoadingMore,
    loadMore: list.loadMore,
  };
}
