import type { ConsultationFeesDto, UpdateConsultationFeesRequestDto } from '@mentora/contracts';
import { z } from 'zod';

const amount = z.string().refine((v) => v.trim() === '' || Number(v) > 0, 'validation.fee');

export const feesFormSchema = z.object({
  first_visit: amount,
  control: amount,
  follow_up: amount,
  medication: amount,
  other: amount,
});

export type FeesFormValues = z.infer<typeof feesFormSchema>;
export type FeeType = keyof FeesFormValues;

const toText = (value: number | null) => (value === null ? '' : String(value));
const toAmount = (value: string) => (value.trim() === '' ? null : Number(value));

export class FeesForm {
  static fromDto(dto: ConsultationFeesDto): FeesFormValues {
    return {
      first_visit: toText(dto.amounts.first_visit),
      control: toText(dto.amounts.control),
      follow_up: toText(dto.amounts.follow_up),
      medication: toText(dto.amounts.medication),
      other: toText(dto.amounts.other),
    };
  }

  static toRequest(values: FeesFormValues): UpdateConsultationFeesRequestDto {
    return {
      amounts: {
        first_visit: toAmount(values.first_visit),
        control: toAmount(values.control),
        follow_up: toAmount(values.follow_up),
        medication: toAmount(values.medication),
        other: toAmount(values.other),
      },
    };
  }
}
