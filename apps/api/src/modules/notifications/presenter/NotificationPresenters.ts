import type { View } from '#core/view/View';
import type { NotificationPageDto } from '../contracts/notifications.contracts';
import type { NotificationCenter } from '../model/NotificationCenter';
import { ListNotificationsPresenter } from './ListNotificationsPresenter';

// Abstract Factory
export class NotificationPresenters {
  constructor(private readonly notificationCenter: NotificationCenter) {}

  listNotifications(view: View<NotificationPageDto>) {
    return new ListNotificationsPresenter(view, this.notificationCenter);
  }
}
