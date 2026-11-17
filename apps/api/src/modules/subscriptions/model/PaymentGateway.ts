import type { CardBrand } from './PaymentMethod';

export interface CardDetails {
  number: string;
  expMonth: number;
  expYear: number;
  cvc: string;
  holderName: string;
}

export interface TokenizedCard {
  token: string;
  brand: CardBrand;
  last4: string;
}

export interface ChargeRequest {
  token: string;
  amount: number;
  currency: string;
  description: string;
  idempotencyKey: string;
}

export type ChargeResult =
  | { outcome: 'approved'; reference: string }
  | { outcome: 'declined'; reason: string }
  | { outcome: 'error'; reason: string };

// Strategy
export abstract class PaymentGateway {
  abstract tokenizeCard(card: CardDetails): Promise<TokenizedCard>;
  abstract charge(request: ChargeRequest): Promise<ChargeResult>;
}
