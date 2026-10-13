import { ValidationError } from '#core/errors/ApplicationError';
import { Entity } from '#core/model/Entity';
import type { AssignedDiagnosis } from './AssignedDiagnosis';
import type { Medication } from './Medication';

export type ConsultationType = 'in_person' | 'virtual';

export interface ConsultationProps {
  date: Date;
  type: ConsultationType;
  reason: string;
  observations: string | null;
  /** Evolution note (`NotaEvolucion`); optional per CU-09 step 4. */
  evolution: string | null;
  diagnosis: AssignedDiagnosis | null;
  medications: Medication[];
  recordedAt: Date;
}

export type NewConsultation = Omit<ConsultationProps, 'recordedAt'>;

/** A consultation inside a clinical record (CU-09). Entity owned by `ClinicalRecord`. */
export class Consultation extends Entity<ConsultationProps> {
  static record(data: NewConsultation, now: Date): Consultation {
    const reason = data.reason.trim();
    if (!reason) {
      throw new ValidationError('The consultation reason is required', { field: 'reason' });
    }
    return new Consultation(crypto.randomUUID(), {
      ...data,
      reason,
      observations: data.observations?.trim() || null,
      evolution: data.evolution?.trim() || null,
      medications: [...data.medications],
      recordedAt: now,
    });
  }

  static restore(id: string, props: ConsultationProps): Consultation {
    return new Consultation(id, props);
  }

  get date(): Date {
    return this.props.date;
  }

  get type(): ConsultationType {
    return this.props.type;
  }

  get reason(): string {
    return this.props.reason;
  }

  get observations(): string | null {
    return this.props.observations;
  }

  get evolution(): string | null {
    return this.props.evolution;
  }

  get diagnosis(): AssignedDiagnosis | null {
    return this.props.diagnosis;
  }

  get medications(): readonly Medication[] {
    return this.props.medications;
  }

  get recordedAt(): Date {
    return this.props.recordedAt;
  }
}
