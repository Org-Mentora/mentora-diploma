import { Router } from 'express';
import { InputParser } from '#core/view/InputParser';
import { JsonHttpView } from '#core/view/JsonHttpView';
import { ActorReader } from '#infrastructure/http/ActorReader';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import { ExpressResponderAdapter } from '#infrastructure/http/ExpressResponderAdapter';
import {
  ListNotificationsQuerySchema,
  type NotificationPageDto,
} from '../contracts/notifications.contracts';
import type { NotificationPresenterFactory } from '../presenter/NotificationPresenterFactory';

export class NotificationRoutes {
  constructor(
    private readonly presenters: NotificationPresenterFactory,
    private readonly guard: AuthGuard,
  ) {}

  build(): Router {
    const router = Router();
    router.use(this.guard.requireActiveSubscription);

    router.get('/', async (req, res) => {
      const view = new JsonHttpView<NotificationPageDto>(new ExpressResponderAdapter(res));
      const query = InputParser.parse(ListNotificationsQuerySchema, req.query);
      await this.presenters
        .listNotifications(view)
        .present({ actor: ActorReader.from(res), ...query });
    });

    return router;
  }
}
