import { ValidationError } from '#core/errors/ApplicationError';
import { Person, type PersonProps } from '#core/model/Person';
import type { FamilyContact } from './FamilyContact';

/** CU-07: `discharged` is the clinical "alta"; `inactive` is set automatically. */
export type PatientStatus = 'active' | 'discharged' | 'inactive';
export type ManualPatientStatus = Exclude<PatientStatus, 'inactive'>;
export type StatusOrigin = 'manual' | 'automatic';

/** Editable data of CU-04 (only names and DNI are required) and CU-06. */
export interface PatientDetails {
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: Date | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  healthInsurance: string | null;
  memberNumber: string | null;
  familyContact: FamilyContact | null;
  debt: number;
  allergies: string[];
  observations: string | null;
}

export interface PatientProps extends PersonProps {
  dni: string;
  professionalId: string;
  healthInsurance: string | null;
  memberNumber: string | null;
  familyContact: FamilyContact | null;
  debt: number;
  allergies: string[];
  observations: string | null;
  status: PatientStatus;
  statusChangedAt: Date;
  statusOrigin: StatusOrigin;
  registeredAt: Date;
  updatedAt: Date;
}

/** A patient of one professional (`Paciente` in the class diagram). */
export class Patient extends Person<PatientProps> {
  static readonly DNI_PATTERN = /^\d{7,8}$/;

  /** CU-04: new patients start as `active`. */
  static register(professionalId: string, details: PatientDetails, now: Date): Patient {
    return new Patient(crypto.randomUUID(), {
      ...Patient.validate(details),
      professionalId,
      status: 'active',
      statusChangedAt: now,
      statusOrigin: 'manual',
      registeredAt: now,
      updatedAt: now,
    });
  }

  static restore(id: string, props: PatientProps): Patient {
    return new Patient(id, props);
  }

  /** Strips dots and spaces so "30.123.456" and "30123456" are the same DNI. */
  static normalizeDni(dni: string): string {
    return dni.replace(/[.\s-]/g, '');
  }

  private static validate(details: PatientDetails): PatientDetails {
    const firstName = details.firstName.trim();
    const lastName = details.lastName.trim();
    if (!firstName || !lastName) {
      throw new ValidationError('First and last name are required', { field: 'name' });
    }
    const dni = Patient.normalizeDni(details.dni);
    if (!Patient.DNI_PATTERN.test(dni)) {
      throw new ValidationError('DNI must have 7 or 8 digits', { field: 'dni' });
    }
    if (details.debt < 0) {
      throw new ValidationError('Debt cannot be negative', { field: 'debt' });
    }
    const allergies = [...new Set(details.allergies.map((a) => a.trim()).filter(Boolean))];
    return { ...details, firstName, lastName, dni, allergies };
  }

  /** CU-06: replaces the editable data. */
  updateDetails(details: PatientDetails, now: Date): void {
    this.props = { ...this.props, ...Patient.validate(details), updatedAt: now };
  }

  /** CU-07 manual flow: the professional discharges or (re)activates the patient. */
  changeStatus(status: ManualPatientStatus, now: Date): void {
    if (status === this.props.status) {
      throw new ValidationError(`Patient is already ${status}`, { field: 'status' });
    }
    this.setStatus(status, now, 'manual');
  }

  /** CU-07 automatic flow: no consultations for three months. */
  markInactive(now: Date): void {
    if (this.props.status === 'active') {
      this.setStatus('inactive', now, 'automatic');
    }
  }

  private setStatus(status: PatientStatus, now: Date, origin: StatusOrigin): void {
    this.props = {
      ...this.props,
      status,
      statusChangedAt: now,
      statusOrigin: origin,
      updatedAt: now,
    };
  }

  override get dni(): string {
    return this.props.dni;
  }

  get professionalId(): string {
    return this.props.professionalId;
  }

  get healthInsurance(): string | null {
    return this.props.healthInsurance;
  }

  get memberNumber(): string | null {
    return this.props.memberNumber;
  }

  get familyContact(): FamilyContact | null {
    return this.props.familyContact;
  }

  get debt(): number {
    return this.props.debt;
  }

  get allergies(): readonly string[] {
    return this.props.allergies;
  }

  get observations(): string | null {
    return this.props.observations;
  }

  get status(): PatientStatus {
    return this.props.status;
  }

  get statusChangedAt(): Date {
    return this.props.statusChangedAt;
  }

  get statusOrigin(): StatusOrigin {
    return this.props.statusOrigin;
  }

  get registeredAt(): Date {
    return this.props.registeredAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
