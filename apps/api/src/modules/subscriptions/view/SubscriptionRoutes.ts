import { type Response, Router } from 'express';
import { PageQuerySchema } from '#core/contracts/Pagination';
import { InputParser } from '#core/view/InputParser';
import { JsonHttpView } from '#core/view/JsonHttpView';
import { ActorReader } from '#infrastructure/http/ActorReader';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import { ExpressResponderAdapter } from '#infrastructure/http/ExpressResponderAdapter';
import {
  AddPaymentMethodRequestSchema,
  AutoDebitRequestSchema,
  ChoosePlanRequestSchema,
  ManualPaymentRequestSchema,
  type PaymentDto,
  PaymentMethodIdParamsSchema,
  type PaymentPageDto,
  RemovePaymentMethodQuerySchema,
  type SubscriptionDetailDto,
  UpdatePaymentMethodRequestSchema,
} from '../contracts/subscriptions.contracts';
import type { SubscriptionPresenterFactory } from '../presenter/SubscriptionPresenterFactory';

export class SubscriptionRoutes {
  constructor(
    private readonly presenters: SubscriptionPresenterFactory,
    private readonly guard: AuthGuard,
  ) {}

  build(): Router {
    const router = Router();
    router.use(this.guard.requireSession);
    const detailView = (res: Response, status = 200) =>
      new JsonHttpView<SubscriptionDetailDto>(new ExpressResponderAdapter(res), status);

    router.get('/', async (_req, res) => {
      await this.presenters.getSubscription(detailView(res)).present(ActorReader.from(res));
    });

    router.put('/plan', async (req, res) => {
      const data = InputParser.parse(ChoosePlanRequestSchema, req.body);
      await this.presenters
        .choosePlan(detailView(res))
        .present({ actor: ActorReader.from(res), data });
    });

    router.post('/payment-methods', async (req, res) => {
      const data = InputParser.parse(AddPaymentMethodRequestSchema, req.body);
      await this.presenters
        .addPaymentMethod(detailView(res, 201))
        .present({ actor: ActorReader.from(res), data });
    });

    router.patch('/payment-methods/:id', async (req, res) => {
      const { id } = InputParser.parse(PaymentMethodIdParamsSchema, req.params);
      const data = InputParser.parse(UpdatePaymentMethodRequestSchema, req.body);
      await this.presenters
        .updatePaymentMethod(detailView(res))
        .present({ actor: ActorReader.from(res), methodId: id, data });
    });

    router.delete('/payment-methods/:id', async (req, res) => {
      const { id } = InputParser.parse(PaymentMethodIdParamsSchema, req.params);
      const { confirm } = InputParser.parse(RemovePaymentMethodQuerySchema, req.query);
      await this.presenters
        .removePaymentMethod(detailView(res))
        .present({ actor: ActorReader.from(res), methodId: id, confirmed: confirm === 'true' });
    });

    router.put('/auto-debit', async (req, res) => {
      const data = InputParser.parse(AutoDebitRequestSchema, req.body);
      await this.presenters
        .setAutoDebit(detailView(res))
        .present({ actor: ActorReader.from(res), data });
    });

    router.post('/cancel', async (_req, res) => {
      await this.presenters.cancelSubscription(detailView(res)).present(ActorReader.from(res));
    });

    router.get('/payments', async (req, res) => {
      const view = new JsonHttpView<PaymentPageDto>(new ExpressResponderAdapter(res));
      const page = InputParser.parse(PageQuerySchema, req.query);
      await this.presenters.listPayments(view).present({ actor: ActorReader.from(res), ...page });
    });

    router.post('/payments', async (req, res) => {
      const view = new JsonHttpView<PaymentDto>(new ExpressResponderAdapter(res), 201);
      const data = InputParser.parse(ManualPaymentRequestSchema, req.body);
      await this.presenters
        .registerManualPayment(view)
        .present({ actor: ActorReader.from(res), data });
    });

    return router;
  }
}
