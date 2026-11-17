import { ValidationError } from '#core/errors/ApplicationError';
import { Entity } from '#core/model/Entity';
import { Appointment, type AppointmentType } from './Appointment';

export type FeeTable = Record<AppointmentType, number | null>;

export interface ConsultationFeesProps {
  currency: string;
  amounts: FeeTable;
  updatedAt: Date;
}

export const APPOINTMENT_TYPES: readonly AppointmentType[] = [
  'first_visit',
  'control',
  'follow_up',
  'medication',
  'other',
];

// Entity
export class ConsultationFees extends Entity<ConsultationFeesProps> {
  static readonly CURRENCY = 'ARS';

  static empty(professionalId: string, now: Date): ConsultationFees {
    const amounts = Object.fromEntries(APPOINTMENT_TYPES.map((type) => [type, null])) as FeeTable;
    return new ConsultationFees(professionalId, {
      currency: ConsultationFees.CURRENCY,
      amounts,
      updatedAt: now,
    });
  }

  static restore(professionalId: string, props: ConsultationFeesProps): ConsultationFees {
    return new ConsultationFees(professionalId, props);
  }

  update(amounts: FeeTable, now: Date): void {
    for (const type of APPOINTMENT_TYPES) {
      const amount = amounts[type];
      if (
        amount !== null &&
        (!Number.isFinite(amount) || amount < 0 || amount > Appointment.MAX_FEE)
      ) {
        throw new ValidationError('Fees must be positive amounts', { field: type });
      }
    }
    this.props = { ...this.props, amounts: { ...amounts }, updatedAt: now };
  }

  feeFor(type: AppointmentType): number | null {
    return this.props.amounts[type] ?? null;
  }

  get professionalId(): string {
    return this.id;
  }

  get currency(): string {
    return this.props.currency;
  }

  get amounts(): FeeTable {
    return { ...this.props.amounts };
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
