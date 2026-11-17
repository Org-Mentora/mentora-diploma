import { ConflictError, NotFoundError } from '#core/errors/ApplicationError';
import type { Clock } from '#core/model/Clock';
import type { TransactionManager } from '#core/model/TransactionManager';
import { type ManualPatientStatus, Patient, type PatientDetails } from './Patient';
import type { PatientRepository } from './PatientRepository';
import { PatientSearch } from './PatientSearch';

const DORMANT_BATCH = 500;

export class PatientService {
  constructor(
    private readonly patients: PatientRepository,
    private readonly transactions: TransactionManager,
    private readonly clock: Clock,
  ) {}

  get now(): Date {
    return this.clock.now();
  }

  register(professionalId: string, details: PatientDetails): Promise<Patient> {
    return this.transactions.run(async () => {
      const patient = Patient.register(professionalId, details, this.clock.now());
      await this.assertDniIsFree(professionalId, patient.dni);
      await this.patients.save(patient);
      return patient;
    });
  }

  search(professionalId: string, query: string | undefined): Promise<Patient[]> {
    return this.patients.search(professionalId, PatientSearch.terms(query));
  }

  async get(professionalId: string, patientId: string): Promise<Patient> {
    const patient = await this.patients.findOwned(professionalId, patientId);
    if (!patient) {
      throw new NotFoundError('Patient', patientId);
    }
    return patient;
  }

  async update(
    professionalId: string,
    patientId: string,
    details: PatientDetails,
  ): Promise<Patient> {
    return this.transactions.run(async () => {
      const patient = await this.get(professionalId, patientId);
      patient.updateDetails(details, this.clock.now());
      await this.assertDniIsFree(professionalId, patient.dni, patient.id);
      await this.patients.save(patient);
      return patient;
    });
  }

  async changeStatus(
    professionalId: string,
    patientId: string,
    status: ManualPatientStatus,
  ): Promise<Patient> {
    return this.transactions.run(async () => {
      const patient = await this.get(professionalId, patientId);
      patient.changeStatus(status, this.clock.now());
      await this.patients.save(patient);
      return patient;
    });
  }

  async inactivateDormant(): Promise<number> {
    const now = this.clock.now();
    const candidates = await this.patients.findDormant(Patient.dormancyCutoff(now), DORMANT_BATCH);
    let inactivated = 0;
    for (const candidate of candidates) {
      const changed = await this.transactions.run(async () => {
        const patient = await this.patients.findById(candidate.id);
        if (!patient?.isDormantAt(now)) {
          return false;
        }
        patient.markInactive(now);
        await this.patients.save(patient);
        return true;
      });
      inactivated += changed ? 1 : 0;
    }
    return inactivated;
  }

  private async assertDniIsFree(professionalId: string, dni: string, ownerId?: string) {
    const existing = await this.patients.findByDni(professionalId, dni);
    if (existing && existing.id !== ownerId) {
      throw new ConflictError('A patient with this DNI is already registered', {
        field: 'dni',
        patientId: existing.id,
      });
    }
  }
}
