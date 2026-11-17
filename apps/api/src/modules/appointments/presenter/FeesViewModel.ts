import type { ConsultationFeesDto } from '../contracts/appointments.contracts';
import type { ConsultationFees } from '../model/ConsultationFees';

export class FeesViewModel {
  static toDto(fees: ConsultationFees): ConsultationFeesDto {
    return {
      currency: fees.currency,
      amounts: fees.amounts,
      updatedAt: fees.updatedAt.toISOString(),
    };
  }
}
