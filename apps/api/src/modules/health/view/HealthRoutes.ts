import { Router } from 'express';
import { ExpressResponderAdapter } from '#infrastructure/http/ExpressResponderAdapter';
import { HttpViews } from '#infrastructure/http/HttpViews';
import type { HealthPresenters } from '../presenter/HealthPresenters';
import { ReadinessHttpView } from './ReadinessHttpView';

export class HealthRoutes {
  constructor(private readonly presenters: HealthPresenters) {}

  build(): Router {
    const router = Router();

    router.get('/', async (_req, res) => {
      await this.presenters.getHealth(HttpViews.json(res)).present();
    });

    router.get('/live', async (_req, res) => {
      await this.presenters.getHealth(HttpViews.json(res), 'process').present();
    });

    router.get('/ready', async (_req, res) => {
      const view = new ReadinessHttpView(new ExpressResponderAdapter(res));
      await this.presenters.getHealth(view).present();
    });

    return router;
  }
}
