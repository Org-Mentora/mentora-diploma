import { Router } from 'express';
import { PageQuerySchema } from '#core/contracts/Pagination';
import { InputParser } from '#core/view/InputParser';
import { ActorReader } from '#infrastructure/http/ActorReader';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import { HttpViews } from '#infrastructure/http/HttpViews';
import {
  AddPaymentMethodRequestSchema,
  AutoDebitRequestSchema,
  ChoosePlanRequestSchema,
  ManualPaymentRequestSchema,
  PaymentMethodIdParamsSchema,
  RemovePaymentMethodQuerySchema,
  UpdatePaymentMethodRequestSchema,
} from '../contracts/subscriptions.contracts';
import type { SubscriptionPresenters } from '../presenter/SubscriptionPresenters';

export class SubscriptionRoutes {
  constructor(
    private readonly presenters: SubscriptionPresenters,
    private readonly guard: AuthGuard,
  ) {}

  build(): Router {
    const router = Router();
    router.use(this.guard.requireSession);

    router.get('/', async (_req, res) => {
      await this.presenters.getSubscription(HttpViews.json(res)).present(ActorReader.from(res));
    });

    router.put('/plan', async (req, res) => {
      const data = InputParser.parse(ChoosePlanRequestSchema, req.body);
      await this.presenters
        .choosePlan(HttpViews.json(res))
        .present({ actor: ActorReader.from(res), data });
    });

    router.post('/payment-methods', async (req, res) => {
      const data = InputParser.parse(AddPaymentMethodRequestSchema, req.body);
      await this.presenters
        .addPaymentMethod(HttpViews.json(res, 201))
        .present({ actor: ActorReader.from(res), data });
    });

    router.patch('/payment-methods/:id', async (req, res) => {
      const { id } = InputParser.parse(PaymentMethodIdParamsSchema, req.params);
      const data = InputParser.parse(UpdatePaymentMethodRequestSchema, req.body);
      await this.presenters
        .updatePaymentMethod(HttpViews.json(res))
        .present({ actor: ActorReader.from(res), methodId: id, data });
    });

    router.delete('/payment-methods/:id', async (req, res) => {
      const { id } = InputParser.parse(PaymentMethodIdParamsSchema, req.params);
      const { confirm } = InputParser.parse(RemovePaymentMethodQuerySchema, req.query);
      await this.presenters
        .removePaymentMethod(HttpViews.json(res))
        .present({ actor: ActorReader.from(res), methodId: id, confirmed: confirm === 'true' });
    });

    router.put('/auto-debit', async (req, res) => {
      const data = InputParser.parse(AutoDebitRequestSchema, req.body);
      await this.presenters
        .setAutoDebit(HttpViews.json(res))
        .present({ actor: ActorReader.from(res), data });
    });

    router.post('/cancel', async (_req, res) => {
      await this.presenters.cancelSubscription(HttpViews.json(res)).present(ActorReader.from(res));
    });

    router.get('/payments', async (req, res) => {
      const page = InputParser.parse(PageQuerySchema, req.query);
      await this.presenters
        .listPayments(HttpViews.json(res))
        .present({ actor: ActorReader.from(res), ...page });
    });

    router.post('/payments', async (req, res) => {
      const data = InputParser.parse(ManualPaymentRequestSchema, req.body);
      await this.presenters
        .registerManualPayment(HttpViews.json(res, 201))
        .present({ actor: ActorReader.from(res), data });
    });

    return router;
  }
}
