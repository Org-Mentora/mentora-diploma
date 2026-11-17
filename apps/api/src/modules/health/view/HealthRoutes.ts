import { Router } from 'express';
import { ExpressResponderAdapter } from '#infrastructure/http/ExpressResponderAdapter';
import type { HealthPresenterFactory } from '../presenter/HealthPresenterFactory';
import { HealthHttpView } from './HealthHttpView';
import { ReadinessHttpView } from './ReadinessHttpView';

export class HealthRoutes {
  constructor(private readonly presenters: HealthPresenterFactory) {}

  build(): Router {
    const router = Router();

    router.get('/', async (_req, res) => {
      const view = new HealthHttpView(new ExpressResponderAdapter(res));
      await this.presenters.getHealth(view).present();
    });

    router.get('/live', async (_req, res) => {
      const view = new HealthHttpView(new ExpressResponderAdapter(res));
      await this.presenters.getHealth(view, 'process').present();
    });

    router.get('/ready', async (_req, res) => {
      const view = new ReadinessHttpView(new ExpressResponderAdapter(res));
      await this.presenters.getHealth(view).present();
    });

    return router;
  }
}
