import { Router } from 'express';
import { InputParser } from '#core/view/InputParser';
import { ActorReader } from '#infrastructure/http/ActorReader';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import { HttpViews } from '#infrastructure/http/HttpViews';
import { ListNotificationsQuerySchema } from '../contracts/notifications.contracts';
import type { NotificationPresenters } from '../presenter/NotificationPresenters';

export class NotificationRoutes {
  constructor(
    private readonly presenters: NotificationPresenters,
    private readonly guard: AuthGuard,
  ) {}

  build(): Router {
    const router = Router();
    router.use(this.guard.requireActiveSubscription);

    router.get('/', async (req, res) => {
      const query = InputParser.parse(ListNotificationsQuerySchema, req.query);
      await this.presenters
        .listNotifications(HttpViews.json(res))
        .present({ actor: ActorReader.from(res), ...query });
    });

    return router;
  }
}
