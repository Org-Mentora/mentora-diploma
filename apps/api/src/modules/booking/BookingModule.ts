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
import type { RateLimiter } from '#infrastructure/http/RateLimiter';
import type { MailTransport } from '#infrastructure/mail/MailTransport';
import type { AppointmentBooking } from '#modules/appointments';
import type { ProfessionalDirectory } from '#modules/auth';
import type { PatientIntake } from '#modules/patients';
import type { SubscriptionAccess } from '#modules/subscriptions';
import { registerBookingContracts } from './contracts/booking.contracts';
import { AppointmentAgendaBooking } from './infrastructure/AppointmentAgendaBooking';
import { AuthPracticeDirectory } from './infrastructure/AuthPracticeDirectory';
import { EmailBookingNotifier } from './infrastructure/EmailBookingNotifier';
import { IntlLocalCalendar } from './infrastructure/IntlLocalCalendar';
import { MongooseBookingPageRepository } from './infrastructure/MongooseBookingPageRepository';
import { MongooseBookingRequestRepository } from './infrastructure/MongooseBookingRequestRepository';
import { PatientIntakeRegistry } from './infrastructure/PatientIntakeRegistry';
import type { BookingNotifier } from './model/BookingNotifier';
import type { BookingPageRepository } from './model/BookingPageRepository';
import type { BookingRequestRepository } from './model/BookingRequestRepository';
import { BookingService } from './model/BookingService';
import { BookingPresenters } from './presenter/BookingPresenters';
import { BookingRoutes } from './view/BookingRoutes';

export interface BookingModuleDependencies {
  guard: AuthGuard;
  limiter: RateLimiter;
  clock: Clock;
  ids: IdGenerator;
  transactions: TransactionManager;
  context: TransactionContext;
  audit: AuditTrail;
  timezone: string;
  professionals: ProfessionalDirectory;
  access: SubscriptionAccess;
  patients: PatientIntake;
  appointments: AppointmentBooking;
  mail: MailTransport;
  dates: DateFormatter;
  logger: AppLogger;
  pages?: BookingPageRepository;
  requests?: BookingRequestRepository;
  notifier?: BookingNotifier;
}

const HOUR_MS = 60 * 60 * 1000;

// Composition Root
export class BookingModule implements AppModule {
  readonly basePath = '/booking';
  readonly #service: BookingService;
  readonly #logger: AppLogger;

  constructor(private readonly deps: BookingModuleDependencies) {
    this.#logger = deps.logger.child({ module: 'booking' });
    this.#service = new BookingService(
      deps.pages ?? new MongooseBookingPageRepository(deps.context),
      deps.requests ?? new MongooseBookingRequestRepository(deps.context),
      new AuthPracticeDirectory(deps.professionals, deps.access),
      new PatientIntakeRegistry(deps.patients),
      new AppointmentAgendaBooking(deps.appointments),
      deps.notifier ?? new EmailBookingNotifier(deps.mail, deps.dates, this.#logger),
      new IntlLocalCalendar(deps.timezone),
      deps.transactions,
      deps.clock,
      deps.ids,
      deps.audit,
    );
  }

  registerContracts(registry: ContractRegistry): void {
    registerBookingContracts(registry);
  }

  createRouter(): Router {
    return new BookingRoutes(
      new BookingPresenters(this.#service),
      this.deps.guard,
      this.deps.limiter,
    ).build();
  }

  scheduledJobs(): ScheduledJob[] {
    return [
      {
        name: 'booking.expire-requests',
        intervalMs: HOUR_MS,
        run: async () => {
          const expired = await this.#service.expirePast();
          if (expired > 0) {
            this.#logger.info('Past booking requests expired', { expired });
          }
        },
      },
    ];
  }
}
