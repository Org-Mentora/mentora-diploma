import type { Page, PageRequest } from '#core/model/Pagination';
import { Repository } from '#core/model/Repository';
import type { Payment } from './Payment';

// Repository
export abstract class PaymentRepository extends Repository<Payment> {
  abstract findByProfessional(professionalId: string, page: PageRequest): Promise<Page<Payment>>;
  abstract countByProfessional(professionalId: string): Promise<number>;
  abstract hasChargeKey(chargeKey: string): Promise<boolean>;
  abstract hasManualReference(professionalId: string, reference: string): Promise<boolean>;
}
