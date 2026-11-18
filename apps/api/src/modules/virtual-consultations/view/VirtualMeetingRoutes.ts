import { Router } from 'express';
import { InputParser } from '#core/view/InputParser';
import { ActorReader } from '#infrastructure/http/ActorReader';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import { HttpViews } from '#infrastructure/http/HttpViews';
import {
  ListVirtualMeetingsQuerySchema,
  StartVirtualMeetingRequestSchema,
} from '../contracts/virtual-consultations.contracts';
import type { VirtualConsultationPresenters } from '../presenter/VirtualConsultationPresenters';

export class VirtualMeetingRoutes {
  constructor(
    private readonly presenters: VirtualConsultationPresenters,
    private readonly guard: AuthGuard,
  ) {}

  build(): Router {
    const router = Router();
    router.use(this.guard.requireActiveSubscription);

    router.post('/', async (req, res) => {
      const data = InputParser.parse(StartVirtualMeetingRequestSchema, req.body);
      await this.presenters
        .startVirtualMeeting(HttpViews.json(res, 201))
        .present({ actor: ActorReader.from(res), data });
    });

    router.get('/', async (req, res) => {
      const query = InputParser.parse(ListVirtualMeetingsQuerySchema, req.query);
      await this.presenters
        .listVirtualMeetings(HttpViews.json(res))
        .present({ actor: ActorReader.from(res), query });
    });

    return router;
  }
}
