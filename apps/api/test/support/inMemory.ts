import type { Entity } from '#core/model/Entity';
import type { Appointment } from '../../src/modules/appointments/model/Appointment';
import {
  type AppointmentEvent,
  AppointmentNotifier,
} from '../../src/modules/appointments/model/AppointmentNotifier';
import { AppointmentRepository } from '../../src/modules/appointments/model/AppointmentRepository';
import type { Professional } from '../../src/modules/auth/model/Professional';
import { ProfessionalRepository } from '../../src/modules/auth/model/ProfessionalRepository';
import type { ClinicalRecord } from '../../src/modules/clinical-records/model/ClinicalRecord';
import { ClinicalRecordRepository } from '../../src/modules/clinical-records/model/ClinicalRecordRepository';
import { DiagnosisCatalogEntry } from '../../src/modules/diagnosis-catalog/model/DiagnosisCatalogEntry';
import {
  DiagnosisCatalogRepository,
  type DiagnosisSearchCriteria,
} from '../../src/modules/diagnosis-catalog/model/DiagnosisCatalogRepository';
import { DiagnosisCatalogSeeder } from '../../src/modules/diagnosis-catalog/model/DiagnosisCatalogSeeder';
import type { Patient } from '../../src/modules/patients/model/Patient';
import { PatientRepository } from '../../src/modules/patients/model/PatientRepository';
import { PatientSearch } from '../../src/modules/patients/model/PatientSearch';

/** Map-backed storage shared by the in-memory repositories below. */
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

  remove(id: string): boolean {
    return this.#items.delete(id);
  }
}

export class InMemoryProfessionalRepository extends ProfessionalRepository {
  readonly #store = new EntityStore<Professional>();

  async findById(id: string): Promise<Professional | null> {
    return this.#store.get(id);
  }

  async findAll(): Promise<Professional[]> {
    return this.#store.all();
  }

  async save(professional: Professional): Promise<void> {
    this.#store.put(professional);
  }

  async delete(id: string): Promise<boolean> {
    return this.#store.remove(id);
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

export class InMemoryPatientRepository extends PatientRepository {
  readonly #store = new EntityStore<Patient>();

  async findById(id: string): Promise<Patient | null> {
    return this.#store.get(id);
  }

  async findAll(): Promise<Patient[]> {
    return this.#store.all();
  }

  async save(patient: Patient): Promise<void> {
    this.#store.put(patient);
  }

  async delete(id: string): Promise<boolean> {
    return this.#store.remove(id);
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

  private owned(professionalId: string): Patient[] {
    return this.#store.all().filter((patient) => patient.professionalId === professionalId);
  }
}

export class InMemoryClinicalRecordRepository extends ClinicalRecordRepository {
  readonly #store = new EntityStore<ClinicalRecord>();

  async findById(id: string): Promise<ClinicalRecord | null> {
    return this.#store.get(id);
  }

  async findAll(): Promise<ClinicalRecord[]> {
    return this.#store.all();
  }

  async save(record: ClinicalRecord): Promise<void> {
    this.#store.put(record);
  }

  async delete(id: string): Promise<boolean> {
    return this.#store.remove(id);
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

export class InMemoryAppointmentRepository extends AppointmentRepository {
  readonly #store = new EntityStore<Appointment>();

  async findById(id: string): Promise<Appointment | null> {
    return this.#store.get(id);
  }

  async findAll(): Promise<Appointment[]> {
    return this.#store.all();
  }

  async save(appointment: Appointment): Promise<void> {
    this.#store.put(appointment);
  }

  async delete(id: string): Promise<boolean> {
    return this.#store.remove(id);
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

  private owned(professionalId: string): Appointment[] {
    return this.#store.all().filter((appointment) => appointment.professionalId === professionalId);
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

/** Counts how many times the module asked to preload the catalog. */
export class SpySeeder extends DiagnosisCatalogSeeder {
  runs = 0;

  async seed(): Promise<number> {
    this.runs += 1;
    return 0;
  }
}

/** Records every agenda notification instead of sending it. */
export class SpyNotifier extends AppointmentNotifier {
  readonly sent: { event: AppointmentEvent; appointmentId: string }[] = [];

  async notify(event: AppointmentEvent, appointment: Appointment): Promise<void> {
    this.sent.push({ event, appointmentId: appointment.id });
  }
}
