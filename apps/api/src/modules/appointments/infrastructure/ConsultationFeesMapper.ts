import type { DataMapper } from '#core/model/DataMapper';
import { APPOINTMENT_TYPES, ConsultationFees, type FeeTable } from '../model/ConsultationFees';
import type { ConsultationFeesDocument } from './ConsultationFeesSchema';

// Data Mapper
export class ConsultationFeesMapper
  implements DataMapper<ConsultationFees, ConsultationFeesDocument>
{
  toDomain(record: ConsultationFeesDocument): ConsultationFees {
    const amounts = Object.fromEntries(
      APPOINTMENT_TYPES.map((type) => [type, record.amounts?.[type] ?? null]),
    ) as FeeTable;
    return ConsultationFees.restore(record._id, {
      currency: record.currency,
      amounts,
      updatedAt: record.updatedAt,
    });
  }

  toPersistence(fees: ConsultationFees): ConsultationFeesDocument {
    return {
      _id: fees.professionalId,
      currency: fees.currency,
      amounts: fees.amounts,
      updatedAt: fees.updatedAt,
    };
  }
}
