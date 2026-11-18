import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type Agent, TestApp } from '../support/TestApp';

const CARD = {
  holderName: 'Ana Garcia',
  cardNumber: '4242 4242 4242 4242',
  expMonth: 12,
  expYear: 2035,
  cvc: '123',
};
const DECLINED = { ...CARD, cardNumber: '4000000000000002' };
const BROKEN = { ...CARD, cardNumber: '4000000000000119' };
const RENEWALS = 'subscriptions.process-renewals';

describe('Subscription API (CU-18, CU-03 trial, CU-01 step 7)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await TestApp.start();
  });

  afterAll(async () => {
    await t.stop();
  });

  afterEach(() => {
    t.clock.set(TestApp.START);
  });

  const newAgent = async (): Promise<{ agent: Agent; email: string }> => {
    const data = TestApp.professional();
    const agent = t.agent();
    await agent.post('/api/auth/register').send(data).expect(201);
    return { agent, email: data.email };
  };

  it('shows the trial, the plans and no payment methods after registering', async () => {
    const { agent } = await newAgent();
    const { body } = await agent.get('/api/subscription').expect(200);

    expect(body).toMatchObject({
      status: 'trial',
      hasAccess: true,
      plan: null,
      daysLeft: 14,
      autoDebit: false,
      paymentMethods: [],
      cancelledAt: null,
    });
    expect(body.availablePlans.map((p: { id: string }) => p.id)).toEqual(['monthly', 'annual']);
  });

  it('stores only a token of the card and validates the number', async () => {
    const { agent } = await newAgent();
    const invalid = await agent
      .post('/api/subscription/payment-methods')
      .send({ ...CARD, cardNumber: '4242 4242 4242 4241' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.details.field).toBe('cardNumber');

    const { body } = await agent.post('/api/subscription/payment-methods').send(CARD).expect(201);
    expect(body.paymentMethods).toEqual([
      expect.objectContaining({ brand: 'visa', label: 'Visa •••• 4242', isDefault: true }),
    ]);
    const stored = await mongoose.connection
      .collection('subscriptions')
      .findOne({ 'contact.email': { $exists: true }, 'paymentMethods.last4': '4242' });
    expect(JSON.stringify(stored)).not.toContain('4242424242424242');
  });

  it('renews automatically at the end of the trial with automatic debit', async () => {
    const { agent, email } = await newAgent();
    await agent.post('/api/subscription/payment-methods').send(CARD).expect(201);
    const chosen = await agent
      .put('/api/subscription/plan')
      .send({ planId: 'monthly' })
      .expect(200);
    expect(chosen.body).toMatchObject({ status: 'trial', plan: { id: 'monthly' } });
    await agent.put('/api/subscription/auto-debit').send({ enabled: true }).expect(200);

    t.clock.advanceDays(15);
    await t.runJob(RENEWALS);

    const { body } = await agent.get('/api/subscription').expect(200);
    expect(body).toMatchObject({ status: 'active', hasAccess: true });
    const payments = await agent.get('/api/subscription/payments').expect(200);
    expect(payments.body.items[0]).toMatchObject({
      kind: 'automatic',
      status: 'approved',
      amount: 25000,
      methodLabel: 'Visa •••• 4242',
    });
    expect(t.mail.lastTo(email)?.subject).toContain('renewed');

    await agent.get('/api/auth/me').expect(200);
    await agent.get('/api/patients').expect(200);
  });

  it('expires a trial without a plan, then reactivates it after paying', async () => {
    const { agent, email } = await newAgent();
    t.clock.advanceDays(15);
    await t.runJob(RENEWALS);

    expect((await agent.get('/api/subscription')).body).toMatchObject({
      status: 'expired',
      hasAccess: false,
    });
    expect(t.mail.lastTo(email)?.subject).toContain('free trial has ended');
    const blocked = await agent.get('/api/patients');
    expect(blocked.body.error.code).toBe('SUBSCRIPTION_INACTIVE');

    const noCard = await agent.put('/api/subscription/plan').send({ planId: 'annual' });
    expect(noCard.status).toBe(409);
    expect(noCard.body.error.code).toBe('PAYMENT_METHOD_REQUIRED');

    await agent.post('/api/subscription/payment-methods').send(DECLINED).expect(201);
    const declined = await agent.put('/api/subscription/plan').send({ planId: 'annual' });
    expect(declined.status).toBe(402);
    expect(declined.body.error.code).toBe('PAYMENT_DECLINED');

    t.clock.advanceMinutes(5);
    await agent
      .post('/api/subscription/payment-methods')
      .send({ ...CARD, makeDefault: true })
      .expect(201);
    const paid = await agent.put('/api/subscription/plan').send({ planId: 'annual' }).expect(200);
    expect(paid.body).toMatchObject({ status: 'active', hasAccess: true, plan: { id: 'annual' } });

    const payments = (await agent.get('/api/subscription/payments')).body.items;
    expect(payments.map((p: { status: string }) => p.status)).toEqual(['approved', 'declined']);
    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body.subscription).toMatchObject({ status: 'active', hasAccess: true });
    await agent.get('/api/patients').expect(200);
  });

  it('charges and extends the period once when the plan is confirmed twice at the same time', async () => {
    const { agent } = await newAgent();
    t.clock.advanceDays(15);
    await t.runJob(RENEWALS);
    await agent.post('/api/subscription/payment-methods').send(CARD).expect(201);

    const [a, b] = await Promise.all([
      agent.put('/api/subscription/plan').send({ planId: 'monthly' }),
      agent.put('/api/subscription/plan').send({ planId: 'monthly' }),
    ]);

    expect([a.status, b.status]).toEqual([200, 200]);
    expect(a.body.currentPeriodEndsAt).toBe(b.body.currentPeriodEndsAt);
    const payments = (await agent.get('/api/subscription/payments')).body.items;
    expect(payments).toHaveLength(1);
  });

  it('marks the subscription pending when the automatic charge is declined', async () => {
    const { agent, email } = await newAgent();
    await agent.post('/api/subscription/payment-methods').send(DECLINED).expect(201);
    await agent.put('/api/subscription/plan').send({ planId: 'monthly' }).expect(200);
    await agent.put('/api/subscription/auto-debit').send({ enabled: true }).expect(200);

    t.clock.advanceDays(15);
    await t.runJob(RENEWALS);

    expect((await agent.get('/api/subscription')).body.status).toBe('pending_payment');
    expect(t.mail.lastTo(email)?.subject).toContain('declined');
  });

  it('suspends after three technical failures in a row', async () => {
    const { agent, email } = await newAgent();
    await agent.post('/api/subscription/payment-methods').send(BROKEN).expect(201);
    await agent.put('/api/subscription/plan').send({ planId: 'monthly' }).expect(200);
    await agent.put('/api/subscription/auto-debit').send({ enabled: true }).expect(200);
    t.clock.advanceDays(15);

    await t.runJob(RENEWALS);
    await t.runJob(RENEWALS);
    expect((await agent.get('/api/subscription')).body.status).toBe('pending_payment');
    await t.runJob(RENEWALS);

    expect((await agent.get('/api/subscription')).body.status).toBe('suspended');
    expect(t.mail.lastTo(email)?.subject).toContain('suspended');
    const failed = (await agent.get('/api/subscription/payments')).body.items;
    expect(failed).toHaveLength(3);
  });

  it('asks for confirmation before removing the only automatic-debit card', async () => {
    const { agent } = await newAgent();
    const added = await agent.post('/api/subscription/payment-methods').send(CARD).expect(201);
    const cardId = added.body.paymentMethods[0].id;
    await agent.put('/api/subscription/auto-debit').send({ enabled: true }).expect(200);

    const unconfirmed = await agent.delete(`/api/subscription/payment-methods/${cardId}`);
    expect(unconfirmed.status).toBe(409);
    expect(unconfirmed.body.error.code).toBe('CONFIRMATION_REQUIRED');

    const removed = await agent
      .delete(`/api/subscription/payment-methods/${cardId}?confirm=true`)
      .expect(200);
    expect(removed.body).toMatchObject({ paymentMethods: [], autoDebit: false });
  });

  it('edits a card and refuses automatic debit without one', async () => {
    const { agent } = await newAgent();
    const noCard = await agent.put('/api/subscription/auto-debit').send({ enabled: true });
    expect(noCard.status).toBe(400);

    const added = await agent.post('/api/subscription/payment-methods').send(CARD).expect(201);
    const cardId = added.body.paymentMethods[0].id;
    const edited = await agent
      .patch(`/api/subscription/payment-methods/${cardId}`)
      .send({ holderName: 'Ana M. Garcia', expYear: 2036 })
      .expect(200);
    expect(edited.body.paymentMethods[0]).toMatchObject({
      holderName: 'Ana M. Garcia',
      expYear: 2036,
    });
    const expired = await agent
      .patch(`/api/subscription/payment-methods/${cardId}`)
      .send({ expMonth: 1, expYear: 2029 });
    expect(expired.status).toBe(400);
  });

  it('registers a manual payment that extends the period', async () => {
    const { agent } = await newAgent();
    const noPlan = await agent
      .post('/api/subscription/payments')
      .send({ amount: 25000, paidAt: '2030-01-01', method: 'bank_transfer' });
    expect(noPlan.status).toBe(400);

    await agent.put('/api/subscription/plan').send({ planId: 'monthly' }).expect(200);
    const short = await agent
      .post('/api/subscription/payments')
      .send({ amount: 100, paidAt: '2030-01-01', method: 'cash' });
    expect(short.status).toBe(400);
    expect(short.body.error.details.field).toBe('amount');

    const early = await agent
      .post('/api/subscription/payments')
      .send({ amount: 25000, paidAt: '2030-01-01', method: 'bank_transfer' });
    expect(early.status).toBe(409);
    expect(early.body.error.code).toBe('PAYMENT_NOT_DUE');

    t.clock.advanceDays(10);
    const stale = await agent
      .post('/api/subscription/payments')
      .send({ amount: 25000, paidAt: '2029-11-01', method: 'bank_transfer' });
    expect(stale.status).toBe(400);
    expect(stale.body.error.details.field).toBe('paidAt');

    const paid = await agent
      .post('/api/subscription/payments')
      .send({ amount: 25000, paidAt: '2030-01-10', method: 'bank_transfer', reference: 'TRX-1' })
      .expect(201);
    expect(paid.body).toMatchObject({
      kind: 'manual',
      methodLabel: 'Bank transfer',
      reference: 'TRX-1',
    });

    const again = await agent
      .post('/api/subscription/payments')
      .send({ amount: 25000, paidAt: '2030-01-10', method: 'bank_transfer', reference: 'TRX-1' });
    expect(again.status).toBe(409);

    const { body } = await agent.get('/api/subscription').expect(200);
    expect(body).toMatchObject({
      status: 'active',
      currentPeriodEndsAt: '2030-02-15T12:00:00.000Z',
    });
  });

  it('cancels keeping access until the paid period ends', async () => {
    const { agent } = await newAgent();
    const cancelled = await agent.post('/api/subscription/cancel').expect(200);
    expect(cancelled.body).toMatchObject({
      status: 'cancelled',
      hasAccess: true,
      autoDebit: false,
    });
    await agent.post('/api/subscription/cancel').expect(409);

    t.clock.advanceDays(15);
    await t.runJob(RENEWALS);
    expect((await agent.get('/api/subscription')).body).toMatchObject({
      status: 'cancelled',
      hasAccess: false,
    });
    await agent.get('/api/auth/me').expect(200);
    await agent.get('/api/patients').expect(403);
  });

  it('billing emails follow the email changed in the profile (CU-16)', async () => {
    const data = TestApp.professional();
    const agent = t.agent();
    await agent.post('/api/auth/register').send(data).expect(201);
    const newEmail = `new.${randomUUID().slice(0, 8)}@mentora.test`;
    await agent
      .put('/api/auth/profile')
      .send({ ...data, email: newEmail, offices: [], password: undefined })
      .expect(200);

    t.clock.advanceDays(15);
    await t.runJob(RENEWALS);
    expect(t.mail.lastTo(newEmail)?.subject).toContain('free trial has ended');
  });

  it('migrates subscriptions stored inside professionals before CU-18', async () => {
    const id = randomUUID();
    const endsAt = new Date('2030-01-10T12:00:00.000Z');
    await mongoose.connection.collection('professionals').insertOne({
      _id: id as never,
      firstName: 'Old',
      lastName: 'Account',
      email: `old.${id}@mentora.test`,
      phone: '+54 11 0000 0000',
      specialty: 'Psychiatry',
      licenseNumber: `OLD-${id}`,
      passwordHash: 'x',
      registeredAt: new Date('2029-12-27T12:00:00.000Z'),
      subscription: { plan: 'trial', endsAt },
    });

    expect(await t.rerunMigrations()).toContain('2026-11-legacy-subscriptions');
    expect(await t.runMigrations()).toEqual([]);

    const migrated = await mongoose.connection
      .collection('subscriptions')
      .findOne({ _id: id as never });
    expect(migrated).toMatchObject({ phase: 'trial', periodEndsAt: endsAt });
    const professional = await mongoose.connection
      .collection('professionals')
      .findOne({ _id: id as never });
    expect(professional).not.toHaveProperty('subscription');
  });
});
