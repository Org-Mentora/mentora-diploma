import { Router } from 'express';
import { InputParser } from '#core/view/InputParser';
import { JsonHttpView } from '#core/view/JsonHttpView';
import { ActorReader } from '#infrastructure/http/ActorReader';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import { ExpressResponderAdapter } from '#infrastructure/http/ExpressResponderAdapter';
import {
  ListVirtualMeetingsQuerySchema,
  StartVirtualMeetingRequestSchema,
  type VirtualMeetingDto,
  type VirtualMeetingPageDto,
} from '../contracts/virtual-consultations.contracts';
import type { VirtualConsultationPresenterFactory } from '../presenter/VirtualConsultationPresenterFactory';

export class VirtualMeetingRoutes {
  constructor(
    private readonly presenters: VirtualConsultationPresenterFactory,
    private readonly guard: AuthGuard,
  ) {}

  build(): Router {
    const router = Router();
    router.use(this.guard.requireActiveSubscription);

    router.post('/', async (req, res) => {
      const view = new JsonHttpView<VirtualMeetingDto>(new ExpressResponderAdapter(res), 201);
      const data = InputParser.parse(StartVirtualMeetingRequestSchema, req.body);
      await this.presenters
        .startVirtualMeeting(view)
        .present({ actor: ActorReader.from(res), data });
    });

    router.get('/', async (req, res) => {
      const view = new JsonHttpView<VirtualMeetingPageDto>(new ExpressResponderAdapter(res));
      const query = InputParser.parse(ListVirtualMeetingsQuerySchema, req.query);
      await this.presenters
        .listVirtualMeetings(view)
        .present({ actor: ActorReader.from(res), query });
    });

    return router;
  }
}
