import { MongooseRepository } from '#infrastructure/database/MongooseRepository';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { ConsultationFees } from '../model/ConsultationFees';
import type { ConsultationFeesRepository } from '../model/ConsultationFeesRepository';
import { ConsultationFeesMapper } from './ConsultationFeesMapper';
import { type ConsultationFeesDocument, ConsultationFeesModel } from './ConsultationFeesSchema';

// Repository, Adapter
export class MongooseConsultationFeesRepository
  extends MongooseRepository<ConsultationFees, ConsultationFeesDocument>
  implements ConsultationFeesRepository
{
  constructor(context: TransactionContext) {
    super(ConsultationFeesModel, new ConsultationFeesMapper(), context);
  }
}
