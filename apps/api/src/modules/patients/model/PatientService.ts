import { ConflictError, NotFoundError } from '#core/errors/ApplicationError';
import type { Clock } from '#core/model/Clock';
import { type ManualPatientStatus, Patient, type PatientDetails } from './Patient';
import type { PatientRepository } from './PatientRepository';
import { PatientSearch } from './PatientSearch';

/** Model service for CU-04..CU-07. */
export class PatientService {
  constructor(
    private readonly patients: PatientRepository,
    private readonly clock: Clock,
  ) {}

  get now(): Date {
    return this.clock.now();
  }

  /** CU-04 */
  async register(professionalId: string, details: PatientDetails): Promise<Patient> {
    const patient = Patient.register(professionalId, details, this.clock.now());
    await this.assertDniIsFree(professionalId, patient.dni);
    await this.patients.save(patient);
    return patient;
  }

  /** CU-05 */
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

  /** CU-06 */
  async update(
    professionalId: string,
    patientId: string,
    details: PatientDetails,
  ): Promise<Patient> {
    const patient = await this.get(professionalId, patientId);
    patient.updateDetails(details, this.clock.now());
    await this.assertDniIsFree(professionalId, patient.dni, patient.id);
    await this.patients.save(patient);
    return patient;
  }

  /** CU-07 (manual flow) */
  async changeStatus(
    professionalId: string,
    patientId: string,
    status: ManualPatientStatus,
  ): Promise<Patient> {
    const patient = await this.get(professionalId, patientId);
    patient.changeStatus(status, this.clock.now());
    await this.patients.save(patient);
    return patient;
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
