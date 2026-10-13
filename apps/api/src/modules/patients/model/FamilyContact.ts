import { ValidationError } from '#core/errors/ApplicationError';
import { ValueObject } from '#core/model/ValueObject';

interface FamilyContactProps {
  name: string;
  phone: string;
}

/** Emergency / family contact of a patient (`ContactoFamiliar`). */
export class FamilyContact extends ValueObject<FamilyContactProps> {
  static create(name: string, phone: string): FamilyContact {
    if (name.trim().length === 0 || phone.trim().length === 0) {
      throw new ValidationError('Family contact needs both a name and a phone', {
        field: 'familyContact',
      });
    }
    return new FamilyContact({ name: name.trim(), phone: phone.trim() });
  }

  get name(): string {
    return this.props.name;
  }

  get phone(): string {
    return this.props.phone;
  }
}
