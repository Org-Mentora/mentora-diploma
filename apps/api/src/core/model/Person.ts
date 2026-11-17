import { Entity } from './Entity';

export interface PersonProps {
  firstName: string;
  lastName: string;
  dni: string | null;
  birthDate: Date | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

// Entity
export abstract class Person<TProps extends PersonProps> extends Entity<TProps> {
  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  get dni(): string | null {
    return this.props.dni;
  }

  get birthDate(): Date | null {
    return this.props.birthDate;
  }

  get gender(): string | null {
    return this.props.gender;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get email(): string | null {
    return this.props.email;
  }

  get address(): string | null {
    return this.props.address;
  }

  age(at: Date): number | null {
    const birth = this.props.birthDate;
    if (!birth) {
      return null;
    }
    let years = at.getUTCFullYear() - birth.getUTCFullYear();
    const beforeBirthday =
      at.getUTCMonth() < birth.getUTCMonth() ||
      (at.getUTCMonth() === birth.getUTCMonth() && at.getUTCDate() < birth.getUTCDate());
    if (beforeBirthday) {
      years -= 1;
    }
    return years;
  }
}
