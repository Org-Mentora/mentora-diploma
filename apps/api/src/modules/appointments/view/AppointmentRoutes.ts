import { Router } from 'express';
import { InputParser } from '#core/view/InputParser';
import { JsonHttpView } from '#core/view/JsonHttpView';
import { ActorReader } from '#infrastructure/http/ActorReader';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import { ExpressResponderAdapter } from '#infrastructure/http/ExpressResponderAdapter';
import {
  type AppointmentDto,
  AppointmentIdParamsSchema,
  ListAppointmentsQuerySchema,
  RescheduleAppointmentRequestSchema,
  ScheduleAppointmentRequestSchema,
} from '../contracts/appointments.contracts';
import type { AppointmentPresenterFactory } from '../presenter/AppointmentPresenterFactory';

/** HTTP entry points of CU-10. Every route requires an active subscription. */
export class AppointmentRoutes {
  constructor(
    private readonly presenters: AppointmentPresenterFactory,
    private readonly guard: AuthGuard,
  ) {}

  build(): Router {
    const router = Router();
    router.use(this.guard.requireActiveSubscription);

    router.get('/', async (req, res) => {
      const view = new JsonHttpView<AppointmentDto[]>(new ExpressResponderAdapter(res));
      const range = InputParser.parse(ListAppointmentsQuerySchema, req.query);
      await this.presenters
        .listAppointments(view)
        .present({ actor: ActorReader.from(res), ...range });
    });

    router.post('/', async (req, res) => {
      const view = new JsonHttpView<AppointmentDto>(new ExpressResponderAdapter(res), 201);
      const data = InputParser.parse(ScheduleAppointmentRequestSchema, req.body);
      await this.presenters
        .scheduleAppointment(view)
        .present({ actor: ActorReader.from(res), data });
    });

    router.get('/:id', async (req, res) => {
      const view = new JsonHttpView<AppointmentDto>(new ExpressResponderAdapter(res));
      const { id } = InputParser.parse(AppointmentIdParamsSchema, req.params);
      await this.presenters
        .getAppointment(view)
        .present({ actor: ActorReader.from(res), appointmentId: id });
    });

    router.put('/:id', async (req, res) => {
      const view = new JsonHttpView<AppointmentDto>(new ExpressResponderAdapter(res));
      const { id } = InputParser.parse(AppointmentIdParamsSchema, req.params);
      const data = InputParser.parse(RescheduleAppointmentRequestSchema, req.body);
      await this.presenters
        .rescheduleAppointment(view)
        .present({ actor: ActorReader.from(res), appointmentId: id, data });
    });

    router.post('/:id/cancel', async (req, res) => {
      const view = new JsonHttpView<AppointmentDto>(new ExpressResponderAdapter(res));
      const { id } = InputParser.parse(AppointmentIdParamsSchema, req.params);
      await this.presenters
        .cancelAppointment(view)
        .present({ actor: ActorReader.from(res), appointmentId: id });
    });

    return router;
  }
}
