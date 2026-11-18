import type { Router } from 'express';
import type { DateFormatter } from '#core/format/DateFormatter';
import type { AppLogger } from '#core/logging/AppLogger';
import type { AuditTrail } from '#core/model/AuditTrail';
import type { Clock } from '#core/model/Clock';
import type { IdGenerator } from '#core/model/IdGenerator';
import type { TransactionManager } from '#core/model/TransactionManager';
import type { AppModule } from '#core/module/AppModule';
import type { ContractRegistry } from '#core/module/ContractRegistry';
import type { ScheduledJob } from '#core/scheduling/ScheduledJob';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import type { NotificationCenter } from '#modules/notifications';
import type { PatientDirectory } from '#modules/patients';
import { registerAppointmentContracts } from './contracts/appointments.contracts';
import { MongooseAgendaLock } from './infrastructure/MongooseAgendaLock';
import { MongooseAppointmentRepository } from './infrastructure/MongooseAppointmentRepository';
import { MongooseConsultationFeesRepository } from './infrastructure/MongooseConsultationFeesRepository';
import { NotificationAppointmentNotifier } from './infrastructure/NotificationAppointmentNotifier';
import { PatientDirectoryNames } from './infrastructure/PatientDirectoryNames';
import type { AgendaLock } from './model/AgendaLock';
import { AppointmentBooking } from './model/AppointmentBooking';
import { AppointmentDirectory } from './model/AppointmentDirectory';
import type { AppointmentNotifier } from './model/AppointmentNotifier';
import type { AppointmentRepository } from './model/AppointmentRepository';
import { AppointmentService } from './model/AppointmentService';
import type { ConsultationFeesRepository } from './model/ConsultationFeesRepository';
import { EarningsService } from './model/EarningsService';
import { AppointmentPresenters } from './presenter/AppointmentPresenters';
import { AppointmentRoutes } from './view/AppointmentRoutes';

export interface AppointmentsModuleDependencies {
  guard: AuthGuard;
  clock: Clock;
  ids: IdGenerator;
  patients: PatientDirectory;
  notifications: NotificationCenter;
  dates: DateFormatter;
  logger: AppLogger;
  transactions: TransactionManager;
  context: TransactionContext;
  audit: AuditTrail;
  timezone: string;
  repository?: AppointmentRepository;
  fees?: ConsultationFeesRepository;
  notifier?: AppointmentNotifier;
  lock?: AgendaLock;
}

const TEN_MINUTES_MS = 10 * 60 * 1000;

// Composition Root
export class AppointmentsModule implements AppModule {
  readonly basePath = '/appointments';
  readonly directory: AppointmentDirectory;
  readonly booking: AppointmentBooking;
  readonly #service: AppointmentService;
  readonly #earnings: EarningsService;
  readonly #logger: AppLogger;

  constructor(private readonly deps: AppointmentsModuleDependencies) {
    const repository =
      deps.repository ?? new MongooseAppointmentRepository(deps.context, deps.timezone);
    const fees = deps.fees ?? new MongooseConsultationFeesRepository(deps.context);
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
      deps.ids,
      fees,
      deps.audit,
    );
    this.booking = new AppointmentBooking(this.#service);
    this.#earnings = new EarningsService(
      fees,
      repository,
      deps.transactions,
      deps.clock,
      deps.audit,
    );
  }

  registerContracts(registry: ContractRegistry): void {
    registerAppointmentContracts(registry);
  }

  createRouter(): Router {
    return new AppointmentRoutes(
      new AppointmentPresenters(this.#service, this.#earnings),
      this.deps.guard,
    ).build();
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
}
