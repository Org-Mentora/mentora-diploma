import { Router } from 'express';
import { ExpressResponderAdapter } from '#infrastructure/http/ExpressResponderAdapter';
import type { HealthPresenterFactory } from '../presenter/HealthPresenterFactory';
import { HealthHttpView } from './HealthHttpView';

/**
 * HTTP entry point of the module. For each request it creates a passive view bound to the
 * response, asks the factory for a presenter and lets the presenter drive the use case.
 */
export class HealthRoutes {
  constructor(private readonly presenters: HealthPresenterFactory) {}

  build(): Router {
    const router = Router();

    router.get('/', async (_req, res) => {
      const view = new HealthHttpView(new ExpressResponderAdapter(res));
      await this.presenters.getHealth(view).present();
    });

    return router;
  }
}
