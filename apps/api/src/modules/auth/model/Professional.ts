import { ValidationError } from '#core/errors/ApplicationError';
import { Person, type PersonProps } from '#core/model/Person';
import { Subscription } from './Subscription';

export interface ProfessionalProps extends PersonProps {
  email: string;
  licenseNumber: string;
  specialty: string;
  passwordHash: string;
  subscription: Subscription;
  registeredAt: Date;
}

export interface NewProfessionalData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty: string;
  licenseNumber: string;
  passwordHash: string;
}

/** A psychiatrist using the system (`Psiquiatra` in the class diagram). */
export class Professional extends Person<ProfessionalProps> {
  /** CU-03: create the account and start the free trial. */
  static register(data: NewProfessionalData, now: Date, trialDays: number): Professional {
    const required = {
      firstName: data.firstName,
      lastName: data.lastName,
      specialty: data.specialty,
    };
    for (const [field, value] of Object.entries(required)) {
      if (value.trim().length === 0) {
        throw new ValidationError(`${field} is required`, { field });
      }
    }
    return new Professional(crypto.randomUUID(), {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: Professional.normalizeEmail(data.email),
      phone: data.phone.trim(),
      specialty: data.specialty.trim(),
      licenseNumber: Professional.normalizeLicense(data.licenseNumber),
      passwordHash: data.passwordHash,
      subscription: Subscription.startTrial(now, trialDays),
      registeredAt: now,
      dni: null,
      birthDate: null,
      gender: null,
      address: null,
    });
  }

  static restore(id: string, props: ProfessionalProps): Professional {
    return new Professional(id, props);
  }

  static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  static normalizeLicense(licenseNumber: string): string {
    return licenseNumber.trim().toUpperCase();
  }

  override get email(): string {
    return this.props.email;
  }

  get licenseNumber(): string {
    return this.props.licenseNumber;
  }

  get specialty(): string {
    return this.props.specialty;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get subscription(): Subscription {
    return this.props.subscription;
  }

  get registeredAt(): Date {
    return this.props.registeredAt;
  }
}
