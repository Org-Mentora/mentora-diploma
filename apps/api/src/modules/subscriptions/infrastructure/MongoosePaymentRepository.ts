import type { Page, PageRequest } from '#core/model/Pagination';
import { Keyset } from '#infrastructure/database/Keyset';
import { MongooseRepository } from '#infrastructure/database/MongooseRepository';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { Payment } from '../model/Payment';
import type { PaymentRepository } from '../model/PaymentRepository';
import { PaymentMapper } from './PaymentMapper';
import { type PaymentDocument, PaymentModel } from './PaymentSchema';

const NEWEST_FIRST = new Keyset([
  { path: 'createdAt', direction: -1, type: 'date' },
  { path: '_id', direction: -1 },
]);

// Repository, Adapter
export class MongoosePaymentRepository
  extends MongooseRepository<Payment, PaymentDocument>
  implements PaymentRepository
{
  constructor(context: TransactionContext) {
    super(PaymentModel, new PaymentMapper(), context);
  }

  async findByProfessional(professionalId: string, page: PageRequest): Promise<Page<Payment>> {
    const records = await this.model
      .find(NEWEST_FIRST.where({ professionalId }, page.after))
      .sort(NEWEST_FIRST.sort())
      .limit(page.limit + 1)
      .session(this.session)
      .lean<PaymentDocument[]>();
    return NEWEST_FIRST.page(records, page, (record) => this.mapper.toDomain(record));
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
