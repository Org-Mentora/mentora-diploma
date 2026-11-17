import type { Entity } from '#core/model/Entity';
import { TransactionManager } from '#core/model/TransactionManager';
import { RateLimitStore, type RateLimitWindow } from '#infrastructure/http/RateLimitStore';
import { AgendaLock } from '../../src/modules/appointments/model/AgendaLock';
import type { Appointment } from '../../src/modules/appointments/model/Appointment';
import {
  type AppointmentEvent,
  AppointmentNotifier,
} from '../../src/modules/appointments/model/AppointmentNotifier';
import { AppointmentRepository } from '../../src/modules/appointments/model/AppointmentRepository';
import { LogoRepository } from '../../src/modules/auth/model/LogoRepository';
import type { PasswordRecovery } from '../../src/modules/auth/model/PasswordRecovery';
import { PasswordRecoveryRepository } from '../../src/modules/auth/model/PasswordRecoveryRepository';
import type { Professional } from '../../src/modules/auth/model/Professional';
import type { ProfessionalLogo } from '../../src/modules/auth/model/ProfessionalLogo';
import { ProfessionalRepository } from '../../src/modules/auth/model/ProfessionalRepository';
import type { ClinicalRecord } from '../../src/modules/clinical-records/model/ClinicalRecord';
import { ClinicalRecordRepository } from '../../src/modules/clinical-records/model/ClinicalRecordRepository';
import {
  type RecordAccess,
  RecordAccessLog,
} from '../../src/modules/clinical-records/model/RecordAccessLog';
import { DiagnosisCatalogEntry } from '../../src/modules/diagnosis-catalog/model/DiagnosisCatalogEntry';
import {
  DiagnosisCatalogRepository,
  type DiagnosisSearchCriteria,
} from '../../src/modules/diagnosis-catalog/model/DiagnosisCatalogRepository';
import { DiagnosisCatalogSeeder } from '../../src/modules/diagnosis-catalog/model/DiagnosisCatalogSeeder';
import type { Notification } from '../../src/modules/notifications/model/Notification';
import { NotificationRepository } from '../../src/modules/notifications/model/NotificationRepository';
import type { Patient } from '../../src/modules/patients/model/Patient';
import { PatientRepository } from '../../src/modules/patients/model/PatientRepository';
import { PatientSearch } from '../../src/modules/patients/model/PatientSearch';
import type { Payment } from '../../src/modules/subscriptions/model/Payment';
import { PaymentRepository } from '../../src/modules/subscriptions/model/PaymentRepository';
import type { Subscription } from '../../src/modules/subscriptions/model/Subscription';
import { SubscriptionRepository } from '../../src/modules/subscriptions/model/SubscriptionRepository';
import { VirtualMeetingRepository } from '../../src/modules/virtual-consultations/model/ports';
import type { VirtualMeeting } from '../../src/modules/virtual-consultations/model/VirtualMeeting';

const newestFirst = <T extends { createdAt: Date }>(a: T, b: T) =>
  b.createdAt.getTime() - a.createdAt.getTime();

class EntityStore<TEntity extends Entity<object>> {
  readonly #items = new Map<string, TEntity>();

  get(id: string): TEntity | null {
    return this.#items.get(id) ?? null;
  }

  all(): TEntity[] {
    return [...this.#items.values()];
  }

  put(entity: TEntity): void {
    this.#items.set(entity.id, entity);
  }
}

// Unit of Work
export class InMemoryTransactionManager extends TransactionManager {
  runs = 0;

  run<T>(work: () => Promise<T>): Promise<T> {
    this.runs += 1;
    return work();
  }
}

export class InMemoryProfessionalRepository extends ProfessionalRepository {
  readonly #store = new EntityStore<Professional>();

  async findById(id: string): Promise<Professional | null> {
    return this.#store.get(id);
  }

  async save(professional: Professional): Promise<void> {
    this.#store.put(professional);
  }

  async findByEmail(email: string): Promise<Professional | null> {
    return this.#store.all().find((professional) => professional.email === email) ?? null;
  }

  async findByLicenseNumber(licenseNumber: string): Promise<Professional | null> {
    return (
      this.#store.all().find((professional) => professional.licenseNumber === licenseNumber) ?? null
    );
  }
}

export class InMemoryPasswordRecoveryRepository extends PasswordRecoveryRepository {
  readonly #store = new EntityStore<PasswordRecovery>();

  async findById(id: string): Promise<PasswordRecovery | null> {
    return this.#store.get(id);
  }

  async save(recovery: PasswordRecovery): Promise<void> {
    this.#store.put(recovery);
  }

  async findLatestUnused(professionalId: string): Promise<PasswordRecovery | null> {
    return (
      this.#store
        .all()
        .filter((recovery) => recovery.professionalId === professionalId && !recovery.usedAt)
        .sort(newestFirst)[0] ?? null
    );
  }
}

export class InMemoryLogoRepository extends LogoRepository {
  readonly #logos = new Map<string, ProfessionalLogo>();

  async find(professionalId: string): Promise<ProfessionalLogo | null> {
    return this.#logos.get(professionalId) ?? null;
  }

  async save(professionalId: string, logo: ProfessionalLogo): Promise<void> {
    this.#logos.set(professionalId, logo);
  }

  async delete(professionalId: string): Promise<void> {
    this.#logos.delete(professionalId);
  }
}

export class InMemoryPatientRepository extends PatientRepository {
  readonly #store = new EntityStore<Patient>();

  async findById(id: string): Promise<Patient | null> {
    return this.#store.get(id);
  }

  async save(patient: Patient): Promise<void> {
    this.#store.put(patient);
  }

  async findOwned(professionalId: string, id: string): Promise<Patient | null> {
    const patient = this.#store.get(id);
    return patient?.professionalId === professionalId ? patient : null;
  }

  async findOwnedMany(professionalId: string, ids: readonly string[]): Promise<Patient[]> {
    return this.owned(professionalId).filter((patient) => ids.includes(patient.id));
  }

  async findByDni(professionalId: string, dni: string): Promise<Patient | null> {
    return this.owned(professionalId).find((patient) => patient.dni === dni) ?? null;
  }

  async search(professionalId: string, terms: readonly string[]): Promise<Patient[]> {
    return this.owned(professionalId).filter((patient) => {
      const text = PatientSearch.indexText(patient.firstName, patient.lastName, patient.dni);
      return terms.every((term) => text.includes(term));
    });
  }

  async findDormant(cutoff: Date, limit: number): Promise<Patient[]> {
    return this.#store
      .all()
      .filter(
        (patient) =>
          patient.status === 'active' &&
          patient.statusChangedAt < cutoff &&
          patient.registeredAt < cutoff &&
          (!patient.lastClinicalActivityAt || patient.lastClinicalActivityAt < cutoff),
      )
      .slice(0, limit);
  }

  private owned(professionalId: string): Patient[] {
    return this.#store.all().filter((patient) => patient.professionalId === professionalId);
  }
}

export class InMemoryClinicalRecordRepository extends ClinicalRecordRepository {
  readonly #store = new EntityStore<ClinicalRecord>();

  async findById(id: string): Promise<ClinicalRecord | null> {
    return this.#store.get(id);
  }

  async save(record: ClinicalRecord): Promise<void> {
    this.#store.put(record);
  }

  async findByPatient(professionalId: string, patientId: string): Promise<ClinicalRecord | null> {
    return (
      this.#store
        .all()
        .find(
          (record) => record.professionalId === professionalId && record.patientId === patientId,
        ) ?? null
    );
  }
}

export class InMemoryRateLimitStore extends RateLimitStore {
  readonly #windows = new Map<string, RateLimitWindow>();

  async hit(id: string, windowMs: number, now: number): Promise<RateLimitWindow> {
    const current = this.#windows.get(id);
    const window =
      current && current.resetsAt > now
        ? { count: current.count + 1, resetsAt: current.resetsAt }
        : { count: 1, resetsAt: now + windowMs };
    this.#windows.set(id, window);
    return window;
  }
}

export class SpyAgendaLock extends AgendaLock {
  readonly acquired: string[] = [];

  async acquire(professionalId: string): Promise<void> {
    this.acquired.push(professionalId);
  }
}

export class InMemoryRecordAccessLog extends RecordAccessLog {
  readonly entries: RecordAccess[] = [];

  async append(access: RecordAccess): Promise<void> {
    this.entries.push(access);
  }

  async findByPatient(
    professionalId: string,
    patientId: string,
    limit: number,
  ): Promise<RecordAccess[]> {
    return this.entries
      .filter((a) => a.professionalId === professionalId && a.patientId === patientId)
      .reverse()
      .slice(0, limit);
  }
}

export class InMemoryAppointmentRepository extends AppointmentRepository {
  readonly #store = new EntityStore<Appointment>();

  async findById(id: string): Promise<Appointment | null> {
    return this.#store.get(id);
  }

  async save(appointment: Appointment): Promise<void> {
    this.#store.put(appointment);
  }

  async findOwned(professionalId: string, id: string): Promise<Appointment | null> {
    const appointment = this.#store.get(id);
    return appointment?.professionalId === professionalId ? appointment : null;
  }

  async findStartingBetween(professionalId: string, from: Date, to: Date): Promise<Appointment[]> {
    return this.owned(professionalId)
      .filter((appointment) => appointment.startsAt >= from && appointment.startsAt < to)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  }

  async findScheduledOverlapping(
    professionalId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<Appointment[]> {
    return this.owned(professionalId).filter(
      (appointment) =>
        appointment.isScheduled && appointment.startsAt < endsAt && appointment.endsAt > startsAt,
    );
  }

  async findNeedingReminder(from: Date, to: Date, limit: number): Promise<Appointment[]> {
    return this.#store
      .all()
      .filter(
        (appointment) =>
          appointment.isScheduled &&
          !appointment.reminderSentAt &&
          appointment.startsAt > from &&
          appointment.startsAt <= to,
      )
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
      .slice(0, limit);
  }

  private owned(professionalId: string): Appointment[] {
    return this.#store.all().filter((appointment) => appointment.professionalId === professionalId);
  }
}

export class InMemorySubscriptionRepository extends SubscriptionRepository {
  readonly #store = new EntityStore<Subscription>();

  async findById(id: string): Promise<Subscription | null> {
    return this.#store.get(id);
  }

  async save(subscription: Subscription): Promise<void> {
    this.#store.put(subscription);
  }

  async findDue(now: Date, limit: number): Promise<Subscription[]> {
    return this.#store
      .all()
      .filter(
        (subscription) =>
          (subscription.phase === 'trial' || subscription.phase === 'active') &&
          !subscription.cancelledAt &&
          subscription.periodEndsAt <= now,
      )
      .sort((a, b) => a.periodEndsAt.getTime() - b.periodEndsAt.getTime())
      .slice(0, limit);
  }
}

export class InMemoryPaymentRepository extends PaymentRepository {
  readonly #store = new EntityStore<Payment>();

  async findById(id: string): Promise<Payment | null> {
    return this.#store.get(id);
  }

  async save(payment: Payment): Promise<void> {
    this.#store.put(payment);
  }

  async findByProfessional(professionalId: string, limit: number): Promise<Payment[]> {
    return this.of(professionalId).sort(newestFirst).slice(0, limit);
  }

  async countByProfessional(professionalId: string): Promise<number> {
    return this.of(professionalId).length;
  }

  async hasChargeKey(chargeKey: string): Promise<boolean> {
    return this.#store.all().some((payment) => payment.chargeKey === chargeKey);
  }

  async hasManualReference(professionalId: string, reference: string): Promise<boolean> {
    return this.of(professionalId).some(
      (payment) => payment.kind === 'manual' && payment.reference === reference,
    );
  }

  private of(professionalId: string): Payment[] {
    return this.#store.all().filter((payment) => payment.professionalId === professionalId);
  }
}

export class InMemoryNotificationRepository extends NotificationRepository {
  readonly #store = new EntityStore<Notification>();

  async findById(id: string): Promise<Notification | null> {
    return this.#store.get(id);
  }

  async save(notification: Notification): Promise<void> {
    this.#store.put(notification);
  }

  async findByPatient(professionalId: string, patientId: string): Promise<Notification[]> {
    return this.#store
      .all()
      .filter((n) => n.professionalId === professionalId && n.patientId === patientId)
      .sort(newestFirst)
      .slice(0, 200);
  }
}

export class InMemoryVirtualMeetingRepository extends VirtualMeetingRepository {
  readonly #store = new EntityStore<VirtualMeeting>();

  async findById(id: string): Promise<VirtualMeeting | null> {
    return this.#store.get(id);
  }

  async save(meeting: VirtualMeeting): Promise<void> {
    this.#store.put(meeting);
  }

  async insertIfFirstForAppointment(meeting: VirtualMeeting): Promise<boolean> {
    const taken =
      meeting.appointmentId !== null &&
      this.#store.all().some((other) => other.appointmentId === meeting.appointmentId);
    if (taken) {
      return false;
    }
    this.#store.put(meeting);
    return true;
  }

  async findByPatient(professionalId: string, patientId: string): Promise<VirtualMeeting[]> {
    return this.#store
      .all()
      .filter((m) => m.professionalId === professionalId && m.patientId === patientId)
      .sort(newestFirst);
  }

  async findByAppointment(
    professionalId: string,
    appointmentId: string,
  ): Promise<VirtualMeeting | null> {
    return (
      this.#store
        .all()
        .find((m) => m.professionalId === professionalId && m.appointmentId === appointmentId) ??
      null
    );
  }
}

export class InMemoryDiagnosisCatalogRepository extends DiagnosisCatalogRepository {
  constructor(private readonly entries: readonly DiagnosisCatalogEntry[]) {
    super();
  }

  async search(criteria: DiagnosisSearchCriteria): Promise<DiagnosisCatalogEntry[]> {
    const term = criteria.term?.toLowerCase();
    return this.entries
      .filter((entry) => entry.active)
      .filter((entry) => !criteria.category || entry.category === criteria.category)
      .filter(
        (entry) =>
          !term ||
          entry.name.toLowerCase().includes(term) ||
          entry.code.toLowerCase().includes(term),
      )
      .slice(0, criteria.limit);
  }

  async findByCode(code: string): Promise<DiagnosisCatalogEntry | null> {
    return this.entries.find((entry) => entry.code === code) ?? null;
  }

  static with(
    ...entries: { code: string; name: string; category: string }[]
  ): InMemoryDiagnosisCatalogRepository {
    return new InMemoryDiagnosisCatalogRepository(
      entries.map(({ code, ...props }) =>
        DiagnosisCatalogEntry.restore(code, { ...props, active: true }),
      ),
    );
  }
}

export class SpySeeder extends DiagnosisCatalogSeeder {
  runs = 0;

  async seed(): Promise<number> {
    this.runs += 1;
    return 0;
  }
}

export class SpyNotifier extends AppointmentNotifier {
  readonly sent: { event: AppointmentEvent; appointmentId: string }[] = [];

  async notify(event: AppointmentEvent, appointment: Appointment): Promise<void> {
    this.sent.push({ event, appointmentId: appointment.id });
  }
}
