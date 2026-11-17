import { Router } from 'express';
import { InputParser } from '#core/view/InputParser';
import { JsonHttpView } from '#core/view/JsonHttpView';
import { ActorReader } from '#infrastructure/http/ActorReader';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import { ExpressResponderAdapter } from '#infrastructure/http/ExpressResponderAdapter';
import {
  type AppointmentDto,
  AppointmentIdParamsSchema,
  type ConsultationFeesDto,
  EarningsQuerySchema,
  type EarningsReportDto,
  ListAppointmentsQuerySchema,
  RescheduleAppointmentRequestSchema,
  ScheduleAppointmentRequestSchema,
  UpdateConsultationFeesRequestSchema,
} from '../contracts/appointments.contracts';
import type { AppointmentPresenterFactory } from '../presenter/AppointmentPresenterFactory';

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

    router.get('/fees', async (_req, res) => {
      const view = new JsonHttpView<ConsultationFeesDto>(new ExpressResponderAdapter(res));
      await this.presenters.getConsultationFees(view).present(ActorReader.from(res));
    });

    router.put('/fees', async (req, res) => {
      const view = new JsonHttpView<ConsultationFeesDto>(new ExpressResponderAdapter(res));
      const data = InputParser.parse(UpdateConsultationFeesRequestSchema, req.body);
      await this.presenters
        .updateConsultationFees(view)
        .present({ actor: ActorReader.from(res), data });
    });

    router.get('/earnings', async (req, res) => {
      const view = new JsonHttpView<EarningsReportDto>(new ExpressResponderAdapter(res));
      const query = InputParser.parse(EarningsQuerySchema, req.query);
      await this.presenters
        .getEarningsReport(view)
        .present({ actor: ActorReader.from(res), ...query });
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
