import { Repository } from '#core/model/Repository';
import type { Professional } from './Professional';

export abstract class ProfessionalRepository extends Repository<Professional> {
  abstract findByEmail(email: string): Promise<Professional | null>;
  abstract findByLicenseNumber(licenseNumber: string): Promise<Professional | null>;
}
