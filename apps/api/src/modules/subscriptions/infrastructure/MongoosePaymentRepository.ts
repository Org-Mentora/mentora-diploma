import { MongooseRepository } from '#infrastructure/database/MongooseRepository';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { Payment } from '../model/Payment';
import type { PaymentRepository } from '../model/PaymentRepository';
import { PaymentMapper } from './PaymentMapper';
import { type PaymentDocument, PaymentModel } from './PaymentSchema';

// Repository, Adapter
export class MongoosePaymentRepository
  extends MongooseRepository<Payment, PaymentDocument>
  implements PaymentRepository
{
  constructor(context: TransactionContext) {
    super(PaymentModel, new PaymentMapper(), context);
  }

  async findByProfessional(professionalId: string): Promise<Payment[]> {
    const records = await this.model
      .find({ professionalId })
      .sort({ createdAt: -1 })
      .session(this.session)
      .lean<PaymentDocument[]>();
    return records.map((record) => this.mapper.toDomain(record));
  }

  countByProfessional(professionalId: string): Promise<number> {
    return this.model.countDocuments({ professionalId }).session(this.session).exec();
  }

  async hasManualReference(professionalId: string, reference: string): Promise<boolean> {
    const found = await this.model
      .exists({ professionalId, kind: 'manual', reference })
      .session(this.session);
    return found !== null;
  }
}
