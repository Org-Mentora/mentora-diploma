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
import type { View } from '#core/view/View';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import type { RateLimiter } from '#infrastructure/http/RateLimiter';
import type { MailTransport } from '#infrastructure/mail/MailTransport';
import type { AppointmentBooking } from '#modules/appointments';
import type { ProfessionalDirectory } from '#modules/auth';
import type { PatientIntake } from '#modules/patients';
import type { SubscriptionAccess } from '#modules/subscriptions';
import {
  type AvailableSlotsDto,
  type BookingReceiptDto,
  type BookingRequestDto,
  type BookingSettingsDto,
  type PublicBookingPageDto,
  registerBookingContracts,
} from './contracts/booking.contracts';
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
import { AcceptBookingRequestPresenter } from './presenter/AcceptBookingRequestPresenter';
import type { BookingPresenterFactory } from './presenter/BookingPresenterFactory';
import { CreateBookingRequestPresenter } from './presenter/CreateBookingRequestPresenter';
import { GetAvailableSlotsPresenter } from './presenter/GetAvailableSlotsPresenter';
import { GetBookingSettingsPresenter } from './presenter/GetBookingSettingsPresenter';
import { GetPublicBookingPagePresenter } from './presenter/GetPublicBookingPagePresenter';
import { ListBookingRequestsPresenter } from './presenter/ListBookingRequestsPresenter';
import { RejectBookingRequestPresenter } from './presenter/RejectBookingRequestPresenter';
import { UpdateBookingSettingsPresenter } from './presenter/UpdateBookingSettingsPresenter';
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

// Composition Root, Abstract Factory
export class BookingModule implements AppModule, BookingPresenterFactory {
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
    return new BookingRoutes(this, this.deps.guard, this.deps.limiter).build();
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

  getBookingSettings(view: View<BookingSettingsDto>): GetBookingSettingsPresenter {
    return new GetBookingSettingsPresenter(view, this.#service);
  }

  updateBookingSettings(view: View<BookingSettingsDto>): UpdateBookingSettingsPresenter {
    return new UpdateBookingSettingsPresenter(view, this.#service);
  }

  listBookingRequests(view: View<BookingRequestDto[]>): ListBookingRequestsPresenter {
    return new ListBookingRequestsPresenter(view, this.#service);
  }

  acceptBookingRequest(view: View<BookingRequestDto>): AcceptBookingRequestPresenter {
    return new AcceptBookingRequestPresenter(view, this.#service);
  }

  rejectBookingRequest(view: View<BookingRequestDto>): RejectBookingRequestPresenter {
    return new RejectBookingRequestPresenter(view, this.#service);
  }

  getPublicBookingPage(view: View<PublicBookingPageDto>): GetPublicBookingPagePresenter {
    return new GetPublicBookingPagePresenter(view, this.#service);
  }

  getAvailableSlots(view: View<AvailableSlotsDto>): GetAvailableSlotsPresenter {
    return new GetAvailableSlotsPresenter(view, this.#service);
  }

  createBookingRequest(view: View<BookingReceiptDto>): CreateBookingRequestPresenter {
    return new CreateBookingRequestPresenter(view, this.#service);
  }
}
