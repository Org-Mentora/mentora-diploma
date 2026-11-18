import { ConflictError, NotFoundError, ValidationError } from '#core/errors/ApplicationError';
import type { AuditTrail } from '#core/model/AuditTrail';
import type { Clock } from '#core/model/Clock';
import type { IdGenerator } from '#core/model/IdGenerator';
import type { Page, PageRequest } from '#core/model/Pagination';
import type { TransactionManager } from '#core/model/TransactionManager';
import type { AgendaBooking, BookedType } from './AgendaBooking';
import type { BookingNotifier } from './BookingNotifier';
import { type BookingModality, BookingPage, type BookingSettings } from './BookingPage';
import type { BookingPageRepository } from './BookingPageRepository';
import { BookingRequest, type BookingRequestStatus, type Requester } from './BookingRequest';
import type { BookingRequestRepository } from './BookingRequestRepository';
import { LocalCalendar } from './LocalCalendar';
import type { PatientRegistry } from './PatientRegistry';
import type { PracticeDirectory, PracticeProfile } from './PracticeDirectory';
import { type DaySlots, type Interval, SlotPlanner } from './SlotPlanner';

export interface PublicBookingPage {
  page: BookingPage;
  profile: PracticeProfile;
}

export interface RequestData {
  requester: Requester;
  startsAt: Date;
  modality: BookingModality;
  reason: string | null;
}

export interface RequestEntry {
  request: BookingRequest;
  existingPatientId: string | null;
}

const MAX_DAYS = 14;
const MAX_PENDING_PER_DNI = 2;
const EXPIRE_BATCH = 200;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class BookingService {
  readonly #planner: SlotPlanner;

  constructor(
    private readonly pages: BookingPageRepository,
    private readonly requests: BookingRequestRepository,
    private readonly practices: PracticeDirectory,
    private readonly patients: PatientRegistry,
    private readonly agenda: AgendaBooking,
    private readonly notifier: BookingNotifier,
    private readonly calendar: LocalCalendar,
    private readonly transactions: TransactionManager,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly audit: AuditTrail,
  ) {
    this.#planner = new SlotPlanner(calendar);
  }

  get timezone(): string {
    return this.calendar.timezone;
  }

  async settings(professionalId: string): Promise<BookingPage> {
    const existing = await this.pages.findById(professionalId);
    if (existing) {
      return existing;
    }
    return this.transactions.run(async () => {
      const again = await this.pages.findById(professionalId);
      if (again) {
        return again;
      }
      const profile = await this.practices.profile(professionalId);
      const page = BookingPage.open(
        professionalId,
        BookingPage.slugFor(profile?.fullName ?? '', this.ids.next()),
        this.clock.now(),
      );
      await this.pages.save(page);
      return page;
    });
  }

  async configure(professionalId: string, settings: BookingSettings): Promise<BookingPage> {
    await this.settings(professionalId);
    return this.transactions.run(async () => {
      const page = await this.pages.findById(professionalId);
      if (!page) {
        throw new NotFoundError('Booking page', professionalId);
      }
      page.configure(settings, this.clock.now());
      await this.pages.save(page);
      await this.audit.record({
        professionalId,
        action: 'booking.settings_updated',
        details: { enabled: page.enabled, slotMinutes: page.slotMinutes },
      });
      return page;
    });
  }

  async publicPage(slug: string): Promise<PublicBookingPage> {
    const page = await this.pages.findBySlug(slug);
    const profile = page?.enabled ? await this.practices.profile(page.professionalId) : null;
    if (!page || !profile || !(await this.practices.hasAccess(page.professionalId))) {
      throw new NotFoundError('Booking page', slug);
    }
    return { page, profile };
  }

  async availability(slug: string, from: string | undefined, days: number): Promise<DaySlots[]> {
    const { page } = await this.publicPage(slug);
    const now = this.clock.now();
    const start = from ?? this.calendar.dateOf(now);
    if (!DATE.test(start)) {
      throw new ValidationError('Dates use the YYYY-MM-DD format', { field: 'from' });
    }
    const count = Math.min(Math.max(days, 1), MAX_DAYS);
    const window = {
      startsAt: this.calendar.instantOf(start, '00:00'),
      endsAt: this.calendar.instantOf(LocalCalendar.addDays(start, count), '00:00'),
    };
    const busy = await this.busy(page.professionalId, window);
    return this.#planner.plan(page, now, start, count, busy);
  }

  async request(slug: string, data: RequestData): Promise<BookingRequest> {
    const { page } = await this.publicPage(slug);
    if (!page.allows(data.modality)) {
      throw new ValidationError('This modality is not available', { field: 'modality' });
    }
    return this.transactions.run(async () => {
      const now = this.clock.now();
      const request = BookingRequest.submit(
        this.ids.next(),
        page.professionalId,
        { ...data, durationMinutes: page.slotMinutes },
        now,
      );
      const pending = await this.requests.countPendingByDni(
        page.professionalId,
        request.requester.dni,
      );
      if (pending >= MAX_PENDING_PER_DNI) {
        throw new ConflictError(
          'You already have pending requests. Wait until the professional answers them.',
          { field: 'dni' },
          'TOO_MANY_PENDING_REQUESTS',
        );
      }
      const busy = await this.busy(page.professionalId, {
        startsAt: request.startsAt,
        endsAt: request.endsAt,
      });
      if (!this.#planner.isAvailable(page, now, request.startsAt, busy)) {
        throw new ConflictError('This time is no longer available. Choose another one.', {
          field: 'startsAt',
        });
      }
      await this.requests.save(request);
      await this.audit.record({
        professionalId: page.professionalId,
        actor: 'patient',
        action: 'booking.requested',
        target: { type: 'booking_request', id: request.id },
        details: {
          requesterName: request.requesterName,
          startsAt: request.startsAt.toISOString(),
          modality: request.modality,
        },
      });
      return request;
    });
  }

  async list(
    professionalId: string,
    status: BookingRequestStatus | null,
    page: PageRequest,
  ): Promise<Page<RequestEntry>> {
    const found = await this.requests.list(professionalId, status, page);
    const items = await Promise.all(
      found.items.map(async (request) => ({
        request,
        existingPatientId:
          request.patientId ??
          (await this.patients.findIdByDni(professionalId, request.requester.dni)),
      })),
    );
    return { items, next: found.next };
  }

  async accept(
    professionalId: string,
    requestId: string,
    decision: { type: BookedType; notes: string | null },
  ): Promise<RequestEntry> {
    const accepted = await this.transactions.run(async () => {
      const request = await this.owned(professionalId, requestId);
      const now = this.clock.now();
      if (request.expireIfPast(now)) {
        await this.requests.save(request);
        return request;
      }
      const patientId =
        (await this.patients.findIdByDni(professionalId, request.requester.dni)) ??
        (await this.patients.register(professionalId, request.requester));
      const appointmentId = await this.agenda.book(professionalId, patientId, {
        startsAt: request.startsAt,
        durationMinutes: request.durationMinutes,
        type: decision.type,
        modality: request.modality,
        notes: decision.notes?.trim() || request.reason,
      });
      request.accept(patientId, appointmentId, now);
      await this.requests.save(request);
      await this.audit.record({
        professionalId,
        action: 'booking.accepted',
        target: { type: 'booking_request', id: request.id },
        details: { requesterName: request.requesterName, appointmentId, patientId },
      });
      return request;
    });
    if (accepted.status === 'expired') {
      throw new ConflictError('The requested time already passed; the request expired', {
        status: 'expired',
      });
    }
    if (accepted.appointmentId) {
      await this.agenda.confirm(professionalId, accepted.appointmentId).catch(() => undefined);
    }
    return { request: accepted, existingPatientId: accepted.patientId };
  }

  async reject(
    professionalId: string,
    requestId: string,
    reason: string | null,
  ): Promise<RequestEntry> {
    const rejected = await this.transactions.run(async () => {
      const request = await this.owned(professionalId, requestId);
      request.reject(reason, this.clock.now());
      await this.requests.save(request);
      await this.audit.record({
        professionalId,
        action: 'booking.rejected',
        target: { type: 'booking_request', id: request.id },
        details: { requesterName: request.requesterName },
      });
      return request;
    });
    const profile = await this.practices.profile(professionalId);
    await this.notifier.rejected(rejected, profile?.fullName ?? '').catch(() => undefined);
    return {
      request: rejected,
      existingPatientId: await this.patients.findIdByDni(professionalId, rejected.requester.dni),
    };
  }

  async expirePast(): Promise<number> {
    const now = this.clock.now();
    let expired = 0;
    for (const candidate of await this.requests.findExpirable(now, EXPIRE_BATCH)) {
      const changed = await this.transactions.run(async () => {
        const request = await this.requests.findById(candidate.id);
        if (!request?.expireIfPast(now)) {
          return false;
        }
        await this.requests.save(request);
        return true;
      });
      expired += changed ? 1 : 0;
    }
    return expired;
  }

  private async owned(professionalId: string, requestId: string): Promise<BookingRequest> {
    const request = await this.requests.findOwned(professionalId, requestId);
    if (!request) {
      throw new NotFoundError('Booking request', requestId);
    }
    return request;
  }

  private async busy(professionalId: string, window: Interval): Promise<Interval[]> {
    const appointments = await this.agenda.busyIntervals(
      professionalId,
      window.startsAt,
      window.endsAt,
    );
    const pending = await this.requests.findPendingBetween(
      professionalId,
      window.startsAt,
      window.endsAt,
    );
    return [
      ...appointments,
      ...pending.map((request) => ({ startsAt: request.startsAt, endsAt: request.endsAt })),
    ];
  }
}
