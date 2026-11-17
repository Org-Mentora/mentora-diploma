import { describe, expect, it } from 'vitest';
import { SimulatedPaymentGateway } from '../../src/modules/subscriptions/infrastructure/SimulatedPaymentGateway';
import { PaymentMethod } from '../../src/modules/subscriptions/model/PaymentMethod';
import { PlanCatalog } from '../../src/modules/subscriptions/model/Plan';
import { Subscription } from '../../src/modules/subscriptions/model/Subscription';

const now = new Date('2030-01-01T00:00:00.000Z');
const days = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);
const catalog = new PlanCatalog({ monthly: 25000, annual: 250000 });
const monthly = catalog.get('monthly');
const contact = { email: 'ana@mentora.test', name: 'Ana García' };

const card = (last4 = '4242') =>
  PaymentMethod.register(
    crypto.randomUUID(),
    {
      brand: 'visa',
      last4,
      expMonth: 12,
      expYear: 2035,
      holderName: 'Ana',
      gatewayToken: `tok-${last4}`,
      addedAt: now,
    },
    now,
  );

describe('Subscription (CU-18 states)', () => {
  it('a trial grants access, then expires without a plan or waits for payment with one', () => {
    const trial = Subscription.startTrial('p-1', contact, now, 14);
    expect(trial.statusAt(days(13))).toBe('trial');
    expect(trial.hasAccessAt(days(13))).toBe(true);
    expect(trial.statusAt(days(14))).toBe('expired');
    expect(trial.isDueAt(days(14))).toBe(true);

    trial.choosePlan(monthly, days(1));
    expect(trial.statusAt(days(14))).toBe('pending_payment');
  });

  it('a payment extends from the end of the period, or from now when it already ended', () => {
    const early = Subscription.startTrial('p-1', contact, now, 14);
    early.applyPayment(monthly, days(1));
    expect(early.periodEndsAt).toEqual(new Date('2030-02-15T00:00:00.000Z'));
    expect(early.statusAt(days(20))).toBe('active');

    const late = Subscription.startTrial('p-2', contact, now, 14);
    late.applyPayment(monthly, days(20));
    expect(late.periodEndsAt).toEqual(new Date('2030-02-21T00:00:00.000Z'));
  });

  it('choosing a plan without access asks for an immediate payment', () => {
    const lapsed = Subscription.startTrial('p-1', contact, now, 14);
    expect(lapsed.choosePlan(monthly, days(20))).toBe(true);
    expect(lapsed.planId).toBeNull();

    const current = Subscription.startTrial('p-2', contact, now, 14);
    expect(current.choosePlan(monthly, days(1))).toBe(false);
    expect(current.planId).toBe('monthly');
  });

  it('suspends after three technical failures', () => {
    const subscription = Subscription.startTrial('p-1', contact, now, 14);
    subscription.recordFailedCharge(days(15));
    subscription.recordFailedCharge(days(15));
    expect(subscription.phase).toBe('trial');
    subscription.recordFailedCharge(days(15));
    expect(subscription.statusAt(days(15))).toBe('suspended');
  });

  it('cancelling keeps the paid period and resuming is possible while it lasts', () => {
    const subscription = Subscription.startTrial('p-1', contact, now, 14);
    subscription.cancel(days(1));
    expect(subscription.statusAt(days(2))).toBe('cancelled');
    expect(subscription.hasAccessAt(days(2))).toBe(true);
    expect(() => subscription.cancel(days(2))).toThrow(/already cancelled/);

    subscription.choosePlan(monthly, days(3));
    expect(subscription.statusAt(days(3))).toBe('trial');
    expect(subscription.cancelledAt).toBeNull();
  });

  it('resuming a cancelled subscription keeps its automatic debit', () => {
    const subscription = Subscription.startTrial('p-1', contact, now, 14);
    subscription.addPaymentMethod(card('4242'), true, now);
    subscription.setAutoDebit(true, now);
    subscription.cancel(days(1));
    expect(subscription.renewsAutomatically).toBe(false);
    expect(subscription.isDueAt(days(15))).toBe(false);

    subscription.choosePlan(monthly, days(2));
    expect(subscription.renewsAutomatically).toBe(true);
  });

  it('manages cards: first is default, debit needs a card, the only debit card needs confirmation', () => {
    const subscription = Subscription.startTrial('p-1', contact, now, 14);
    expect(() => subscription.setAutoDebit(true, now)).toThrow(/payment method/);

    const first = card('4242');
    const second = card('1881');
    subscription.addPaymentMethod(first, false, now);
    subscription.addPaymentMethod(second, false, now);
    expect(subscription.defaultPaymentMethod?.id).toBe(first.id);

    subscription.setAutoDebit(true, now);
    subscription.removePaymentMethod(first.id, false, now);
    expect(subscription.defaultPaymentMethod?.id).toBe(second.id);
    expect(() => subscription.removePaymentMethod(second.id, false, now)).toThrow(/only card/);
    subscription.removePaymentMethod(second.id, true, now);
    expect(subscription.autoDebit).toBe(false);
  });
});

describe('PaymentMethod', () => {
  it('rejects expired cards and labels the brand', () => {
    expect(card().label).toBe('Visa •••• 4242');
    expect(() => PaymentMethod.assertValidExpiry(12, 2029, now)).toThrow(/expired/);
    expect(() => PaymentMethod.assertValidExpiry(13, 2035, now)).toThrow(/month/);
  });
});

describe('SimulatedPaymentGateway (ADR-0029)', () => {
  const gateway = new SimulatedPaymentGateway();
  const details = { expMonth: 12, expYear: 2035, cvc: '123', holderName: 'Ana' };
  const charge = (token: string, idempotencyKey: string = crypto.randomUUID()) =>
    gateway.charge({ token, amount: 100, currency: 'ARS', description: 'test', idempotencyKey });

  it('validates numbers and detects brands', async () => {
    await expect(gateway.tokenizeCard({ ...details, number: '4242424242424241' })).rejects.toThrow(
      /not valid/,
    );
    await expect(
      gateway.tokenizeCard({ ...details, number: '4242424242424242', cvc: '1' }),
    ).rejects.toThrow(/security code/);
    expect((await gateway.tokenizeCard({ ...details, number: '5555555555554444' })).brand).toBe(
      'mastercard',
    );
    expect((await gateway.tokenizeCard({ ...details, number: '378282246310005' })).brand).toBe(
      'amex',
    );
  });

  it('approves, declines or fails according to the test card', async () => {
    const ok = await gateway.tokenizeCard({ ...details, number: '4242424242424242' });
    const declined = await gateway.tokenizeCard({ ...details, number: '4000000000009995' });
    const broken = await gateway.tokenizeCard({ ...details, number: '4000000000000119' });

    expect((await charge(ok.token)).outcome).toBe('approved');
    expect(await charge(declined.token)).toEqual({
      outcome: 'declined',
      reason: 'insufficient funds',
    });
    expect((await charge(broken.token)).outcome).toBe('error');
  });

  it('returns the same result for the same idempotency key', async () => {
    const ok = await gateway.tokenizeCard({ ...details, number: '4242424242424242' });
    const first = await charge(ok.token, 'same-key');
    const second = await charge(ok.token, 'same-key');
    expect(second).toEqual(first);
  });
});
