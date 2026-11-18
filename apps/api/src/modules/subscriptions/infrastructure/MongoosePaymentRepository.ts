import type { Page, PageRequest } from '#core/model/Pagination';
import { Keyset } from '#infrastructure/database/Keyset';
import { MongooseRepository } from '#infrastructure/database/MongooseRepository';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { Payment } from '../model/Payment';
import type { PaymentRepository } from '../model/PaymentRepository';
import { PaymentMapper } from './PaymentMapper';
import { type PaymentDocument, PaymentModel } from './PaymentSchema';

const NEWEST_FIRST = Keyset.newestFirst();

// Repository, Adapter
export class MongoosePaymentRepository
  extends MongooseRepository<Payment, PaymentDocument>
  implements PaymentRepository
{
  constructor(context: TransactionContext) {
    super(PaymentModel, new PaymentMapper(), context);
  }

  async findByProfessional(professionalId: string, page: PageRequest): Promise<Page<Payment>> {
    return this.findPage(NEWEST_FIRST, { professionalId }, page);
  }

  countByProfessional(professionalId: string): Promise<number> {
    return this.model.countDocuments({ professionalId }).session(this.session).exec();
  }

  async hasChargeKey(chargeKey: string): Promise<boolean> {
    return (await this.model.exists({ chargeKey }).session(this.session)) !== null;
  }

  async hasManualReference(professionalId: string, reference: string): Promise<boolean> {
    const found = await this.model
      .exists({ professionalId, kind: 'manual', reference })
      .session(this.session);
    return found !== null;
  }
}
