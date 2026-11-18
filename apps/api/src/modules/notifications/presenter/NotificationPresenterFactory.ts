import type { View } from '#core/view/View';
import type { NotificationPageDto } from '../contracts/notifications.contracts';
import type { ListNotificationsPresenter } from './ListNotificationsPresenter';

// Abstract Factory
export interface NotificationPresenterFactory {
  listNotifications(view: View<NotificationPageDto>): ListNotificationsPresenter;
}
