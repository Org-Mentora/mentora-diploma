import { ValidationError } from '#core/errors/ApplicationError';
import { Person, type PersonProps } from '#core/model/Person';

export interface ProfessionalProps extends PersonProps {
  email: string;
  licenseNumber: string;
  specialty: string;
  offices: string[];
  passwordHash: string;
  passwordChangedAt: Date | null;
  logoUpdatedAt: Date | null;
  registeredAt: Date;
  updatedAt: Date;
}

export interface ProfessionalProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty: string;
  licenseNumber: string;
  offices: string[];
}

export interface NewProfessionalData extends ProfessionalProfile {
  passwordHash: string;
}

const MAX_OFFICES = 5;

// Aggregate Root
export class Professional extends Person<ProfessionalProps> {
  static register(data: NewProfessionalData, now: Date): Professional {
    return new Professional(crypto.randomUUID(), {
      ...Professional.validate(data),
      passwordHash: data.passwordHash,
      passwordChangedAt: null,
      logoUpdatedAt: null,
      registeredAt: now,
      updatedAt: now,
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

  private static validate(profile: ProfessionalProfile): ProfessionalProfile {
    const required = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      specialty: profile.specialty,
      phone: profile.phone,
      licenseNumber: profile.licenseNumber,
    };
    for (const [field, value] of Object.entries(required)) {
      if (value.trim().length === 0) {
        throw new ValidationError(`${field} is required`, { field });
      }
    }
    const offices = [...new Set(profile.offices.map((o) => o.trim()).filter(Boolean))];
    if (offices.length > MAX_OFFICES) {
      throw new ValidationError(`You can register up to ${MAX_OFFICES} offices`, {
        field: 'offices',
      });
    }
    return {
      firstName: profile.firstName.trim(),
      lastName: profile.lastName.trim(),
      email: Professional.normalizeEmail(profile.email),
      phone: profile.phone.trim(),
      specialty: profile.specialty.trim(),
      licenseNumber: Professional.normalizeLicense(profile.licenseNumber),
      offices,
    };
  }

  updateProfile(profile: ProfessionalProfile, now: Date): void {
    this.props = { ...this.props, ...Professional.validate(profile), updatedAt: now };
  }

  changePasswordHash(passwordHash: string, now: Date): void {
    this.props = { ...this.props, passwordHash, passwordChangedAt: now, updatedAt: now };
  }

  markLogo(updatedAt: Date | null, now: Date): void {
    this.props = { ...this.props, logoUpdatedAt: updatedAt, updatedAt: now };
  }

  override get email(): string {
    return this.props.email;
  }

  override get phone(): string {
    return this.props.phone ?? '';
  }

  get licenseNumber(): string {
    return this.props.licenseNumber;
  }

  get specialty(): string {
    return this.props.specialty;
  }

  get offices(): readonly string[] {
    return this.props.offices;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get passwordChangedAt(): Date | null {
    return this.props.passwordChangedAt;
  }

  get credentialsVersion(): number {
    return this.props.passwordChangedAt?.getTime() ?? 0;
  }

  get logoUpdatedAt(): Date | null {
    return this.props.logoUpdatedAt;
  }

  get hasLogo(): boolean {
    return this.props.logoUpdatedAt !== null;
  }

  get registeredAt(): Date {
    return this.props.registeredAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get profile(): ProfessionalProfile {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phone: this.phone,
      specialty: this.specialty,
      licenseNumber: this.licenseNumber,
      offices: [...this.offices],
    };
  }
}
