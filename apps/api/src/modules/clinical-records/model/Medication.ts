import { ValidationError } from '#core/errors/ApplicationError';
import { ValueObject } from '#core/model/ValueObject';

export interface MedicationData {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  indications: string | null;
}

interface MedicationProps extends MedicationData {
  prescribedAt: Date;
}

/** Medication indicated in a consultation (CU-12). Prescriptions are never edited in place. */
export class Medication extends ValueObject<MedicationProps> {
  static prescribe(data: MedicationData, now: Date): Medication {
    const required = {
      name: data.name,
      dose: data.dose,
      frequency: data.frequency,
      duration: data.duration,
    };
    for (const [field, value] of Object.entries(required)) {
      if (value.trim().length === 0) {
        throw new ValidationError(`Medication ${field} is required`, { field });
      }
    }
    return new Medication({
      name: data.name.trim(),
      dose: data.dose.trim(),
      frequency: data.frequency.trim(),
      duration: data.duration.trim(),
      indications: data.indications?.trim() || null,
      prescribedAt: now,
    });
  }

  static restore(props: MedicationProps): Medication {
    return new Medication(props);
  }

  get name(): string {
    return this.props.name;
  }

  get dose(): string {
    return this.props.dose;
  }

  get frequency(): string {
    return this.props.frequency;
  }

  get duration(): string {
    return this.props.duration;
  }

  get indications(): string | null {
    return this.props.indications;
  }

  get prescribedAt(): Date {
    return this.props.prescribedAt;
  }
}
