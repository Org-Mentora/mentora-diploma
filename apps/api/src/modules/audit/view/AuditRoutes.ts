import { Router } from 'express';
import { InputParser } from '#core/view/InputParser';
import { ActorReader } from '#infrastructure/http/ActorReader';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import { HttpViews } from '#infrastructure/http/HttpViews';
import { ListAuditEventsQuerySchema } from '../contracts/audit.contracts';
import type { AuditPresenters } from '../presenter/AuditPresenters';

export class AuditRoutes {
  constructor(
    private readonly presenters: AuditPresenters,
    private readonly guard: AuthGuard,
  ) {}

  build(): Router {
    const router = Router();
    router.use(this.guard.requireSession);

    router.get('/events', async (req, res) => {
      const query = InputParser.parse(ListAuditEventsQuerySchema, req.query);
      await this.presenters
        .listAuditEvents(HttpViews.json(res))
        .present({ actor: ActorReader.from(res), query });
    });

    return router;
  }
}
