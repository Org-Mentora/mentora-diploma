import type { Router } from 'express';
import type { AppLogger } from '#core/logging/AppLogger';
import type { Clock } from '#core/model/Clock';
import type { TransactionManager } from '#core/model/TransactionManager';
import type { AppModule } from '#core/module/AppModule';
import type { ContractRegistry } from '#core/module/ContractRegistry';
import type { ScheduledJob } from '#core/scheduling/ScheduledJob';
import type { View } from '#core/view/View';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { DateTimeFormatter } from '#infrastructure/format/DateTimeFormatter';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import type { NotificationCenter } from '#modules/notifications';
import type { PatientDirectory } from '#modules/patients';
import {
  type AppointmentDto,
  registerAppointmentContracts,
} from './contracts/appointments.contracts';
import { MongooseAgendaLock } from './infrastructure/MongooseAgendaLock';
import { MongooseAppointmentRepository } from './infrastructure/MongooseAppointmentRepository';
import { NotificationAppointmentNotifier } from './infrastructure/NotificationAppointmentNotifier';
import { PatientDirectoryNames } from './infrastructure/PatientDirectoryNames';
import type { AgendaLock } from './model/AgendaLock';
import { AppointmentDirectory } from './model/AppointmentDirectory';
import type { AppointmentNotifier } from './model/AppointmentNotifier';
import type { AppointmentRepository } from './model/AppointmentRepository';
import { AppointmentService } from './model/AppointmentService';
import type { AppointmentPresenterFactory } from './presenter/AppointmentPresenterFactory';
import { CancelAppointmentPresenter } from './presenter/CancelAppointmentPresenter';
import { GetAppointmentPresenter } from './presenter/GetAppointmentPresenter';
import { ListAppointmentsPresenter } from './presenter/ListAppointmentsPresenter';
import { RescheduleAppointmentPresenter } from './presenter/RescheduleAppointmentPresenter';
import { ScheduleAppointmentPresenter } from './presenter/ScheduleAppointmentPresenter';
import { AppointmentRoutes } from './view/AppointmentRoutes';

export interface AppointmentsModuleDependencies {
  guard: AuthGuard;
  clock: Clock;
  patients: PatientDirectory;
  notifications: NotificationCenter;
  dates: DateTimeFormatter;
  logger: AppLogger;
  transactions: TransactionManager;
  context: TransactionContext;
  repository?: AppointmentRepository;
  notifier?: AppointmentNotifier;
  lock?: AgendaLock;
}

const TEN_MINUTES_MS = 10 * 60 * 1000;

// Composition Root, Abstract Factory
export class AppointmentsModule implements AppModule, AppointmentPresenterFactory {
  readonly basePath = '/appointments';
  readonly directory: AppointmentDirectory;
  readonly #service: AppointmentService;
  readonly #logger: AppLogger;

  constructor(private readonly deps: AppointmentsModuleDependencies) {
    const repository = deps.repository ?? new MongooseAppointmentRepository(deps.context);
    this.#logger = deps.logger.child({ module: 'appointments' });
    this.directory = new AppointmentDirectory(repository);
    this.#service = new AppointmentService(
      repository,
      deps.transactions,
      new PatientDirectoryNames(deps.patients),
      deps.notifier ??
        new NotificationAppointmentNotifier(
          deps.patients,
          deps.notifications,
          deps.dates,
          this.#logger,
        ),
      deps.clock,
      deps.lock ?? new MongooseAgendaLock(deps.context),
    );
  }

  registerContracts(registry: ContractRegistry): void {
    registerAppointmentContracts(registry);
  }

  createRouter(): Router {
    return new AppointmentRoutes(this, this.deps.guard).build();
  }

  scheduledJobs(): ScheduledJob[] {
    return [
      {
        name: 'appointments.send-reminders',
        intervalMs: TEN_MINUTES_MS,
        run: async () => {
          const sent = await this.#service.sendDueReminders();
          if (sent > 0) {
            this.#logger.info('Appointment reminders sent', { sent });
          }
        },
      },
    ];
  }

  listAppointments(view: View<AppointmentDto[]>): ListAppointmentsPresenter {
    return new ListAppointmentsPresenter(view, this.#service);
  }

  getAppointment(view: View<AppointmentDto>): GetAppointmentPresenter {
    return new GetAppointmentPresenter(view, this.#service);
  }

  scheduleAppointment(view: View<AppointmentDto>): ScheduleAppointmentPresenter {
    return new ScheduleAppointmentPresenter(view, this.#service);
  }

  rescheduleAppointment(view: View<AppointmentDto>): RescheduleAppointmentPresenter {
    return new RescheduleAppointmentPresenter(view, this.#service);
  }

  cancelAppointment(view: View<AppointmentDto>): CancelAppointmentPresenter {
    return new CancelAppointmentPresenter(view, this.#service);
  }
}
