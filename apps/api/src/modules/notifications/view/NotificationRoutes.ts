import { Router } from 'express';
import { InputParser } from '#core/view/InputParser';
import { JsonHttpView } from '#core/view/JsonHttpView';
import { ActorReader } from '#infrastructure/http/ActorReader';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import { ExpressResponderAdapter } from '#infrastructure/http/ExpressResponderAdapter';
import {
  ListNotificationsQuerySchema,
  type NotificationDto,
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
      const view = new JsonHttpView<NotificationDto[]>(new ExpressResponderAdapter(res));
      const { patientId } = InputParser.parse(ListNotificationsQuerySchema, req.query);
      await this.presenters
        .listNotifications(view)
        .present({ actor: ActorReader.from(res), patientId });
    });

    return router;
  }
}
