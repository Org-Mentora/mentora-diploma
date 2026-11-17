import { randomInt } from 'node:crypto';
import { RecoveryCodeGenerator } from '../model/RecoveryCodeGenerator';

// Adapter
export class CryptoRecoveryCodeGenerator extends RecoveryCodeGenerator {
  generate(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }
}
