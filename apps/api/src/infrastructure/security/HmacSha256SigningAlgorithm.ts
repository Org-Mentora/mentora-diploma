import { createSecretKey, type KeyObject } from 'node:crypto';
import { TokenSigningAlgorithm } from './TokenSigningAlgorithm';

// Strategy
export class HmacSha256SigningAlgorithm extends TokenSigningAlgorithm {
  readonly name = 'HS256';
  readonly signingKey: KeyObject;
  readonly verificationKey: KeyObject;

  constructor(secret: string) {
    super();
    this.signingKey = createSecretKey(Buffer.from(secret, 'utf8'));
    this.verificationKey = this.signingKey;
  }
}
