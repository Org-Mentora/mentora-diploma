import { Router } from 'express';
import { InputParser } from '#core/view/InputParser';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import { HttpViews } from '#infrastructure/http/HttpViews';
import { SearchDiagnosesQuerySchema } from '../contracts/diagnosis-catalog.contracts';
import type { DiagnosisCatalogPresenters } from '../presenter/DiagnosisCatalogPresenters';

export class DiagnosisCatalogRoutes {
  constructor(
    private readonly presenters: DiagnosisCatalogPresenters,
    private readonly guard: AuthGuard,
  ) {}

  build(): Router {
    const router = Router();
    router.use(this.guard.requireActiveSubscription);

    router.get('/', async (req, res) => {
      const { q, ...query } = InputParser.parse(SearchDiagnosesQuerySchema, req.query);
      await this.presenters.searchDiagnoses(HttpViews.json(res)).present({ term: q, ...query });
    });

    return router;
  }
}
