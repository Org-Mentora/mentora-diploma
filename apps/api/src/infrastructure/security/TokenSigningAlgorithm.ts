import type { KeyObject } from 'node:crypto';

// Strategy
export abstract class TokenSigningAlgorithm {
  abstract readonly name: string;
  abstract readonly signingKey: KeyObject;
  abstract readonly verificationKey: KeyObject;
}
