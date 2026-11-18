import type { Router } from 'express';
import type { Clock } from '#core/model/Clock';
import type { IdGenerator } from '#core/model/IdGenerator';
import type { AppModule } from '#core/module/AppModule';
import type { ContractRegistry } from '#core/module/ContractRegistry';
import type { View } from '#core/view/View';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import type { MailTransport } from '#infrastructure/mail/MailTransport';
import {
  type NotificationPageDto,
  registerNotificationContracts,
} from './contracts/notifications.contracts';
import { MailEmailGateway } from './infrastructure/MailEmailGateway';
import { MongooseNotificationRepository } from './infrastructure/MongooseNotificationRepository';
import { NotificationCenter } from './model/NotificationCenter';
import type { NotificationRepository } from './model/NotificationRepository';
import type { WhatsAppGateway } from './model/WhatsAppGateway';
import { ListNotificationsPresenter } from './presenter/ListNotificationsPresenter';
import type { NotificationPresenterFactory } from './presenter/NotificationPresenterFactory';
import { NotificationRoutes } from './view/NotificationRoutes';

export interface NotificationsModuleDependencies {
  guard: AuthGuard;
  clock: Clock;
  ids: IdGenerator;
  context: TransactionContext;
  whatsapp: WhatsAppGateway;
  mail: MailTransport;
  repository?: NotificationRepository;
}

// Composition Root, Abstract Factory
export class NotificationsModule implements AppModule, NotificationPresenterFactory {
  readonly basePath = '/notifications';
  readonly center: NotificationCenter;

  constructor(private readonly deps: NotificationsModuleDependencies) {
    this.center = new NotificationCenter(
      deps.repository ?? new MongooseNotificationRepository(deps.context),
      deps.whatsapp,
      new MailEmailGateway(deps.mail),
      deps.clock,
      deps.ids,
    );
  }

  registerContracts(registry: ContractRegistry): void {
    registerNotificationContracts(registry);
  }

  createRouter(): Router {
    return new NotificationRoutes(this, this.deps.guard).build();
  }

  listNotifications(view: View<NotificationPageDto>): ListNotificationsPresenter {
    return new ListNotificationsPresenter(view, this.center);
  }
}
