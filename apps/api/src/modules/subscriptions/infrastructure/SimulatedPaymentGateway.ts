import { ValidationError } from '#core/errors/ApplicationError';
import {
  type CardDetails,
  type ChargeRequest,
  type ChargeResult,
  PaymentGateway,
  type TokenizedCard,
} from '../model/PaymentGateway';
import type { CardBrand } from '../model/PaymentMethod';

type Behaviour = 'ok' | 'declined' | 'error';

const TEST_CARDS: Record<string, { behaviour: Behaviour; reason?: string }> = {
  '4000000000000002': { behaviour: 'declined', reason: 'card declined' },
  '4000000000009995': { behaviour: 'declined', reason: 'insufficient funds' },
  '4000000000000119': { behaviour: 'error', reason: 'processing error' },
};

// Adapter
export class SimulatedPaymentGateway extends PaymentGateway {
  readonly #charges = new Map<string, ChargeResult>();

  async tokenizeCard(card: CardDetails): Promise<TokenizedCard> {
    const number = card.number.replace(/[\s-]/g, '');
    if (!/^\d{13,19}$/.test(number) || !SimulatedPaymentGateway.passesLuhn(number)) {
      throw new ValidationError('The card number is not valid', { field: 'cardNumber' });
    }
    if (!/^\d{3,4}$/.test(card.cvc)) {
      throw new ValidationError('The security code is not valid', { field: 'cvc' });
    }
    const test = TEST_CARDS[number];
    const behaviour = test?.behaviour ?? 'ok';
    const reason = encodeURIComponent(test?.reason ?? '');
    return {
      token: `sim_${behaviour}_${reason}_${crypto.randomUUID()}`,
      brand: SimulatedPaymentGateway.brandOf(number),
      last4: number.slice(-4),
    };
  }

  async charge(request: ChargeRequest): Promise<ChargeResult> {
    const previous = this.#charges.get(request.idempotencyKey);
    if (previous) {
      return previous;
    }
    const result = SimulatedPaymentGateway.resultFor(request);
    this.#charges.set(request.idempotencyKey, result);
    return result;
  }

  private static resultFor(request: ChargeRequest): ChargeResult {
    const [prefix, behaviour, reason] = request.token.split('_');
    if (prefix !== 'sim' || request.amount <= 0) {
      return { outcome: 'declined', reason: 'invalid payment method' };
    }
    const why = decodeURIComponent(reason ?? '');
    switch (behaviour) {
      case 'declined':
        return { outcome: 'declined', reason: why || 'card declined' };
      case 'error':
        return { outcome: 'error', reason: why || 'processing error' };
      default:
        return { outcome: 'approved', reference: `sim_ch_${crypto.randomUUID()}` };
    }
  }

  private static brandOf(number: string): CardBrand {
    if (number.startsWith('4')) {
      return 'visa';
    }
    if (/^3[47]/.test(number)) {
      return 'amex';
    }
    const prefix = Number(number.slice(0, 4));
    if (/^5[1-5]/.test(number) || (prefix >= 2221 && prefix <= 2720)) {
      return 'mastercard';
    }
    return 'other';
  }

  private static passesLuhn(number: string): boolean {
    let sum = 0;
    let double = false;
    for (let i = number.length - 1; i >= 0; i -= 1) {
      let digit = Number(number[i]);
      if (double) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
      double = !double;
    }
    return sum % 10 === 0;
  }
}
