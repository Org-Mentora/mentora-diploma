import { Router } from 'express';
import { InputParser } from '#core/view/InputParser';
import { ActorReader } from '#infrastructure/http/ActorReader';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import { HttpViews } from '#infrastructure/http/HttpViews';
import {
  AppointmentIdParamsSchema,
  EarningsQuerySchema,
  ListAppointmentsQuerySchema,
  RescheduleAppointmentRequestSchema,
  ScheduleAppointmentRequestSchema,
  UpdateConsultationFeesRequestSchema,
} from '../contracts/appointments.contracts';
import type { AppointmentPresenters } from '../presenter/AppointmentPresenters';

export class AppointmentRoutes {
  constructor(
    private readonly presenters: AppointmentPresenters,
    private readonly guard: AuthGuard,
  ) {}

  build(): Router {
    const router = Router();
    router.use(this.guard.requireActiveSubscription);

    router.get('/', async (req, res) => {
      const range = InputParser.parse(ListAppointmentsQuerySchema, req.query);
      await this.presenters
        .listAppointments(HttpViews.json(res))
        .present({ actor: ActorReader.from(res), ...range });
    });

    router.post('/', async (req, res) => {
      const data = InputParser.parse(ScheduleAppointmentRequestSchema, req.body);
      await this.presenters
        .scheduleAppointment(HttpViews.json(res, 201))
        .present({ actor: ActorReader.from(res), data });
    });

    router.get('/fees', async (_req, res) => {
      await this.presenters.getConsultationFees(HttpViews.json(res)).present(ActorReader.from(res));
    });

    router.put('/fees', async (req, res) => {
      const data = InputParser.parse(UpdateConsultationFeesRequestSchema, req.body);
      await this.presenters
        .updateConsultationFees(HttpViews.json(res))
        .present({ actor: ActorReader.from(res), data });
    });

    router.get('/earnings', async (req, res) => {
      const query = InputParser.parse(EarningsQuerySchema, req.query);
      await this.presenters
        .getEarningsReport(HttpViews.json(res))
        .present({ actor: ActorReader.from(res), ...query });
    });

    router.get('/:id', async (req, res) => {
      const { id } = InputParser.parse(AppointmentIdParamsSchema, req.params);
      await this.presenters
        .getAppointment(HttpViews.json(res))
        .present({ actor: ActorReader.from(res), appointmentId: id });
    });

    router.put('/:id', async (req, res) => {
      const { id } = InputParser.parse(AppointmentIdParamsSchema, req.params);
      const data = InputParser.parse(RescheduleAppointmentRequestSchema, req.body);
      await this.presenters
        .rescheduleAppointment(HttpViews.json(res))
        .present({ actor: ActorReader.from(res), appointmentId: id, data });
    });

    router.post('/:id/cancel', async (req, res) => {
      const { id } = InputParser.parse(AppointmentIdParamsSchema, req.params);
      await this.presenters
        .cancelAppointment(HttpViews.json(res))
        .present({ actor: ActorReader.from(res), appointmentId: id });
    });

    return router;
  }
}
