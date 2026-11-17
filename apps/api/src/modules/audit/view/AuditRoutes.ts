import { Router } from 'express';
import { InputParser } from '#core/view/InputParser';
import { JsonHttpView } from '#core/view/JsonHttpView';
import { ActorReader } from '#infrastructure/http/ActorReader';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import { ExpressResponderAdapter } from '#infrastructure/http/ExpressResponderAdapter';
import { type AuditEventPageDto, ListAuditEventsQuerySchema } from '../contracts/audit.contracts';
import type { AuditPresenterFactory } from '../presenter/AuditPresenterFactory';

export class AuditRoutes {
  constructor(
    private readonly presenters: AuditPresenterFactory,
    private readonly guard: AuthGuard,
  ) {}

  build(): Router {
    const router = Router();
    router.use(this.guard.requireSession);

    router.get('/events', async (req, res) => {
      const view = new JsonHttpView<AuditEventPageDto>(new ExpressResponderAdapter(res));
      const query = InputParser.parse(ListAuditEventsQuerySchema, req.query);
      await this.presenters.listAuditEvents(view).present({ actor: ActorReader.from(res), query });
    });

    return router;
  }
}
