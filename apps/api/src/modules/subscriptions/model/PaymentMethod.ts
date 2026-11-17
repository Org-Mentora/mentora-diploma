import { ValidationError } from '#core/errors/ApplicationError';
import { ValueObject } from '#core/model/ValueObject';

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'other';

const BRAND_LABEL: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  other: 'Card',
};

export interface PaymentMethodProps {
  id: string;
  brand: CardBrand;
  last4: string;
  expMonth: number;
  expYear: number;
  holderName: string;
  gatewayToken: string;
  addedAt: Date;
}

// Value Object
export class PaymentMethod extends ValueObject<PaymentMethodProps> {
  static register(id: string, props: Omit<PaymentMethodProps, 'id'>, now: Date): PaymentMethod {
    PaymentMethod.assertValidExpiry(props.expMonth, props.expYear, now);
    const holderName = props.holderName.trim();
    if (!holderName) {
      throw new ValidationError('The card holder name is required', { field: 'holderName' });
    }
    return new PaymentMethod({ ...props, holderName, id });
  }

  static restore(props: PaymentMethodProps): PaymentMethod {
    return new PaymentMethod(props);
  }

  static assertValidExpiry(expMonth: number, expYear: number, now: Date): void {
    if (!Number.isInteger(expMonth) || expMonth < 1 || expMonth > 12) {
      throw new ValidationError('Expiry month must be between 1 and 12', { field: 'expMonth' });
    }
    const lastValidDay = Date.UTC(expYear, expMonth, 1);
    if (!Number.isInteger(expYear) || lastValidDay <= now.getTime()) {
      throw new ValidationError('The card is expired', { field: 'expYear' });
    }
  }

  withChanges(
    changes: {
      holderName?: string | undefined;
      expMonth?: number | undefined;
      expYear?: number | undefined;
    },
    now: Date,
  ): PaymentMethod {
    const expMonth = changes.expMonth ?? this.props.expMonth;
    const expYear = changes.expYear ?? this.props.expYear;
    PaymentMethod.assertValidExpiry(expMonth, expYear, now);
    const holderName = (changes.holderName ?? this.props.holderName).trim();
    if (!holderName) {
      throw new ValidationError('The card holder name is required', { field: 'holderName' });
    }
    return new PaymentMethod({ ...this.props, holderName, expMonth, expYear });
  }

  get id(): string {
    return this.props.id;
  }

  get brand(): CardBrand {
    return this.props.brand;
  }

  get last4(): string {
    return this.props.last4;
  }

  get expMonth(): number {
    return this.props.expMonth;
  }

  get expYear(): number {
    return this.props.expYear;
  }

  get holderName(): string {
    return this.props.holderName;
  }

  get gatewayToken(): string {
    return this.props.gatewayToken;
  }

  get addedAt(): Date {
    return this.props.addedAt;
  }

  get label(): string {
    const brand = BRAND_LABEL[this.props.brand];
    return `${brand} •••• ${this.props.last4}`;
  }
}
