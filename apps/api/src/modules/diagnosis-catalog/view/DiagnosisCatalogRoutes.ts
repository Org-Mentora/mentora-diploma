import { Router } from 'express';
import { InputParser } from '#core/view/InputParser';
import { JsonHttpView } from '#core/view/JsonHttpView';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import { ExpressResponderAdapter } from '#infrastructure/http/ExpressResponderAdapter';
import {
  type DiagnosisCatalogPageDto,
  SearchDiagnosesQuerySchema,
} from '../contracts/diagnosis-catalog.contracts';
import type { DiagnosisCatalogPresenterFactory } from '../presenter/DiagnosisCatalogPresenterFactory';

export class DiagnosisCatalogRoutes {
  constructor(
    private readonly presenters: DiagnosisCatalogPresenterFactory,
    private readonly guard: AuthGuard,
  ) {}

  build(): Router {
    const router = Router();
    router.use(this.guard.requireActiveSubscription);

    router.get('/', async (req, res) => {
      const view = new JsonHttpView<DiagnosisCatalogPageDto>(new ExpressResponderAdapter(res));
      const { q, ...query } = InputParser.parse(SearchDiagnosesQuerySchema, req.query);
      await this.presenters.searchDiagnoses(view).present({ term: q, ...query });
    });

    return router;
  }
}
