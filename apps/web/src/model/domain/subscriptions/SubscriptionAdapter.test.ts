import type { PaymentDto, SubscriptionDetailDto } from '@mentora/contracts';
import { describe, expect, it } from 'vitest';
import { SubscriptionAdapter } from './SubscriptionAdapter';
import { SubscriptionForms } from './subscription.forms';

const monthly = {
  id: 'monthly' as const,
  name: 'Monthly',
  description: 'Billed every month.',
  months: 1,
  price: 25000,
  currency: 'ARS',
};
const annual = { ...monthly, id: 'annual' as const, name: 'Annual', months: 12, price: 250000 };

const dto = (overrides: Partial<SubscriptionDetailDto> = {}): SubscriptionDetailDto => ({
  status: 'trial',
  hasAccess: true,
  plan: null,
  currentPeriodEndsAt: '2030-01-15T12:00:00.000Z',
  daysLeft: 14,
  autoDebit: false,
  paymentMethods: [],
  cancelledAt: null,
  availablePlans: [monthly, annual],
  ...overrides,
});

describe('SubscriptionAdapter (CU-18)', () => {
  it('describes the trial and the plans', () => {
    expect(SubscriptionAdapter.toOverview(dto())).toMatchObject({
      statusLabel: 'Free trial',
      planName: 'No plan chosen yet',
      periodLabel: 'Trial ends on 15 Jan 2030 (14 days left)',
      needsAction: false,
    });
    const plans = SubscriptionAdapter.toPlanOptions(dto({ plan: annual }));
    expect(plans.map((p) => [p.name, p.isCurrent])).toEqual([
      ['Monthly', false],
      ['Annual', true],
    ]);
    expect(plans[1]?.priceLabel).toMatch(/250[.,]000 \/ 12 months$/);
  });

  it('asks for action without access and explains cancellations', () => {
    expect(
      SubscriptionAdapter.toOverview(dto({ status: 'suspended', hasAccess: false })),
    ).toMatchObject({
      statusTone: 'danger',
      needsAction: true,
      periodLabel: 'Access ended on 15 Jan 2030',
    });
    expect(
      SubscriptionAdapter.toOverview(dto({ status: 'cancelled', plan: monthly })).periodLabel,
    ).toBe('Access until 15 Jan 2030; it will not renew');
  });

  it('formats cards and payments', () => {
    const [card] = SubscriptionAdapter.toPaymentMethods(
      dto({
        paymentMethods: [
          {
            id: 'c',
            brand: 'visa',
            label: 'Visa •••• 4242',
            last4: '4242',
            expMonth: 3,
            expYear: 2031,
            holderName: 'Ana',
            isDefault: true,
          },
        ],
      }),
    );
    expect(card?.expiry).toBe('03/31');

    const declined: PaymentDto = {
      id: 'p',
      planId: 'monthly',
      amount: 25000,
      currency: 'ARS',
      kind: 'automatic',
      status: 'declined',
      methodLabel: 'Visa •••• 0002',
      reference: null,
      failureReason: 'insufficient funds',
      paidAt: '2030-01-15T12:00:00.000Z',
    };
    expect(SubscriptionAdapter.toPayment(declined)).toMatchObject({
      kindLabel: 'Automatic debit',
      statusLabel: 'Declined',
      statusTone: 'danger',
      detail: 'insufficient funds',
    });
  });
});

describe('SubscriptionForms', () => {
  it('maps the card form to the API (spaces removed, MM/YY split)', () => {
    expect(
      SubscriptionForms.toAddCard({
        holderName: ' Ana ',
        cardNumber: '4242 4242 4242 4242',
        expiry: '07/32',
        cvc: '123',
        makeDefault: true,
      }),
    ).toEqual({
      holderName: 'Ana',
      cardNumber: '4242424242424242',
      expMonth: 7,
      expYear: 2032,
      cvc: '123',
      makeDefault: true,
    });
  });
});
