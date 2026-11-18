import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Agent, TestApp } from '../support/TestApp';

describe('Online booking by patients', () => {
  let t: TestApp;
  let agent: Agent;
  let slug: string;

  const requester = (overrides: Record<string, unknown> = {}) => ({
    firstName: 'Lucas',
    lastName: 'Ibarra',
    dni: '40.111.222',
    phone: '+54 11 4444 1111',
    email: 'lucas@example.test',
    startsAt: '2030-01-02T12:00:00.000Z',
    modality: 'in_person',
    reason: 'First visit',
    ...overrides,
  });

  beforeAll(async () => {
    t = await TestApp.start();
    agent = await t.loggedInAgent({ firstName: 'Laura', lastName: 'Gómez' });
  });

  afterAll(async () => {
    await t.stop();
  });

  it('creates a disabled booking page with a public slug', async () => {
    const { body } = await agent.get('/api/booking/settings').expect(200);
    slug = body.slug;

    expect(slug).toMatch(/^laura-gomez-[a-z0-9]{6}$/);
    expect(body).toMatchObject({ enabled: false, slotMinutes: 45 });
    await request(t.app).get(`/api/booking/public/${slug}`).expect(404);
  });

  it('publishes the page and lists free slots in the professional time zone', async () => {
    const { body: settings } = await agent.get('/api/booking/settings');
    const { slug: _slug, timezone: _timezone, ...rest } = settings;
    await agent
      .put('/api/booking/settings')
      .send({ ...rest, enabled: true })
      .expect(200);

    const page = await request(t.app).get(`/api/booking/public/${slug}`).expect(200);
    const slots = await request(t.app)
      .get(`/api/booking/public/${slug}/slots?from=2030-01-02&days=1`)
      .expect(200);

    expect(page.body.professional.fullName).toBe('Laura Gómez');
    expect(slots.body.days[0].slots).toHaveLength(10);
    expect(slots.body.days[0].slots[0]).toBe('2030-01-02T12:00:00.000Z');
  });

  it('accepts a request only for a free slot of the page', async () => {
    const created = await request(t.app)
      .post(`/api/booking/public/${slug}/requests`)
      .send(requester());
    const taken = await request(t.app)
      .post(`/api/booking/public/${slug}/requests`)
      .send(requester({ dni: '41222333' }));
    const offGrid = await request(t.app)
      .post(`/api/booking/public/${slug}/requests`)
      .send(requester({ dni: '41222333', startsAt: '2030-01-02T12:10:00.000Z' }));

    expect(created.status).toBe(201);
    expect(created.body.status).toBe('pending');
    expect(taken.status).toBe(409);
    expect(offGrid.status).toBe(409);
  });

  it('turns an accepted request into a patient and an online appointment', async () => {
    const {
      body: { items: pending },
    } = await agent.get('/api/booking/requests?status=pending').expect(200);
    expect(pending).toHaveLength(1);
    expect(pending[0].existingPatientId).toBeNull();

    const { body: accepted } = await agent
      .post(`/api/booking/requests/${pending[0].id}/accept`)
      .send({ type: 'first_visit' })
      .expect(200);
    const { body: appointment } = await agent
      .get(`/api/appointments/${accepted.appointmentId}`)
      .expect(200);
    const {
      body: { items: patients },
    } = await agent.get('/api/patients?q=40111222').expect(200);

    expect(accepted.status).toBe('accepted');
    expect(appointment).toMatchObject({ source: 'online', patientName: 'Lucas Ibarra' });
    expect(patients).toHaveLength(1);
    expect(t.whatsapp.sent.some((m) => m.body.includes('Lucas'))).toBe(true);
  });

  it('emails the requester when the professional rejects the request', async () => {
    const { body: receipt } = await request(t.app)
      .post(`/api/booking/public/${slug}/requests`)
      .send(requester({ dni: '42333444', email: 'sofia@example.test', firstName: 'Sofía' }))
      .send({ startsAt: '2030-01-02T12:45:00.000Z' })
      .expect(201);

    const { body } = await agent
      .post(`/api/booking/requests/${receipt.id}/reject`)
      .send({ reason: 'No availability' })
      .expect(200);

    expect(body.status).toBe('rejected');
    expect(t.mail.lastTo('sofia@example.test')?.text).toContain('No availability');
  });
});

describe('Consultation fees and earnings', () => {
  let t: TestApp;
  let agent: Agent;
  let patientId: string;

  beforeAll(async () => {
    t = await TestApp.start();
    agent = await t.loggedInAgent();
    const { body } = await agent
      .post('/api/patients')
      .send({ firstName: 'Tomás', lastName: 'Silva', dni: '36777888' })
      .expect(201);
    patientId = body.id;
  });

  afterAll(async () => {
    await t.stop();
  });

  const schedule = (startsAt: string, extra: Record<string, unknown> = {}) =>
    agent
      .post('/api/appointments')
      .send({
        patientId,
        startsAt,
        durationMinutes: 45,
        type: 'control',
        modality: 'in_person',
        ...extra,
      })
      .expect(201);

  it('uses the fee of the type unless the appointment sets its own', async () => {
    await agent
      .put('/api/appointments/fees')
      .send({
        amounts: {
          first_visit: 30000,
          control: 20000,
          follow_up: null,
          medication: null,
          other: null,
        },
      })
      .expect(200);

    const byType = await schedule('2030-01-03T13:00:00.000Z');
    const custom = await schedule('2030-02-10T13:00:00.000Z', { fee: 15000 });
    const free = await schedule('2030-02-11T13:00:00.000Z', { type: 'follow_up' });

    expect(byType.body.fee).toBe(20000);
    expect(custom.body.fee).toBe(15000);
    expect(free.body.fee).toBeNull();
  });

  it('reports earned (held) and projected (upcoming) amounts per month', async () => {
    t.clock.set(new Date('2030-01-05T12:00:00.000Z'));

    const { body } = await agent
      .get('/api/appointments/earnings?from=2030-01&to=2030-03')
      .expect(200);

    expect(body.months.map((m: { month: string }) => m.month)).toEqual([
      '2030-01',
      '2030-02',
      '2030-03',
    ]);
    expect(body.months[0]).toMatchObject({ earned: 20000, projected: 0, appointments: 1 });
    expect(body.months[1]).toMatchObject({ earned: 0, projected: 15000, unpriced: 1 });
    expect(body.totals).toMatchObject({ earned: 20000, projected: 15000, appointments: 3 });
    await agent.get('/api/appointments/earnings?from=2030-01&to=2032-06').expect(400);
  });
});

describe('User audit trail', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await TestApp.start();
  });

  afterAll(async () => {
    await t.stop();
  });

  it('records who did what, when and from where, newest first', async () => {
    const professional = TestApp.professional();
    const agent = t.agent();
    await agent.post('/api/auth/register').send(professional).expect(201);
    t.clock.advanceMinutes(1);
    await t
      .agent()
      .post('/api/auth/login')
      .send({ email: professional.email, password: 'wrong-password1' })
      .expect(401);
    t.clock.advanceMinutes(1);
    await agent
      .post('/api/patients')
      .set('User-Agent', 'audit-test')
      .send({ firstName: 'Ana', lastName: 'Ruiz', dni: '30111222' })
      .expect(201);

    const { body } = await agent.get('/api/audit/events').expect(200);
    const { body: patients } = await agent.get('/api/audit/events?category=patient').expect(200);

    expect(body.items.map((e: { action: string }) => e.action)).toEqual([
      'patient.created',
      'session.login_failed',
      'account.registered',
    ]);
    expect(patients.items[0]).toMatchObject({
      actor: 'professional',
      targetType: 'patient',
      userAgent: 'audit-test',
      details: { patientName: 'Ana Ruiz' },
    });
    expect(patients.items[0].ip).toBeTruthy();
  });

  it('records the logout of the session and pages older events', async () => {
    const professional = TestApp.professional();
    const agent = t.agent();
    await agent.post('/api/auth/register').send(professional).expect(201);
    t.clock.advanceMinutes(1);
    await agent.post('/api/auth/logout').expect(204);
    t.clock.advanceMinutes(1);
    await agent
      .post('/api/auth/login')
      .send({ email: professional.email, password: professional.password })
      .expect(200);

    const first = await agent.get('/api/audit/events?limit=2').expect(200);
    const next = await agent
      .get(`/api/audit/events?limit=2&cursor=${first.body.nextCursor}`)
      .expect(200);

    expect(first.body.items.map((e: { action: string }) => e.action)).toEqual([
      'session.login',
      'session.logout',
    ]);
    expect(next.body.items.map((e: { action: string }) => e.action)).toEqual([
      'account.registered',
    ]);
    expect(next.body.nextCursor).toBeNull();
  });
});
