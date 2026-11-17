import { Repository } from '#core/model/Repository';
import type { Payment } from './Payment';

// Repository
export abstract class PaymentRepository extends Repository<Payment> {
  abstract findByProfessional(professionalId: string): Promise<Payment[]>;
  abstract countByProfessional(professionalId: string): Promise<number>;
  abstract hasManualReference(professionalId: string, reference: string): Promise<boolean>;
}
