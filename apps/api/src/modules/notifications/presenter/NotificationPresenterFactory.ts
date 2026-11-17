import type { View } from '#core/view/View';
import type { NotificationDto } from '../contracts/notifications.contracts';
import type { ListNotificationsPresenter } from './ListNotificationsPresenter';

// Abstract Factory
export interface NotificationPresenterFactory {
  listNotifications(view: View<NotificationDto[]>): ListNotificationsPresenter;
}
