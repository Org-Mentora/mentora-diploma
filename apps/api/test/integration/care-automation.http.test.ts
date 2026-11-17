import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { type Agent, TestApp } from '../support/TestApp';

let dniSeed = 40_000_000;
const nextDni = () => {
  dniSeed += 1;
  return String(dniSeed);
};

describe('Care automation API (CU-07 automatic, CU-14, CU-15)', () => {
  let t: TestApp;
  let agent: Agent;

  beforeAll(async () => {
    t = await TestApp.start();
    agent = await t.loggedInAgent();
  });

  afterAll(async () => {
    await t.stop();
  });

  afterEach(() => {
    t.clock.set(TestApp.START);
  });

  const patient = async (extra: Record<string, unknown> = {}) => {
    const { body } = await agent
      .post('/api/patients')
      .send({ firstName: 'Lucía', lastName: 'Paz', dni: nextDni(), ...extra })
      .expect(201);
    return body.id as string;
  };

  const schedule = (patientId: string, startsAt: string, extra: Record<string, unknown> = {}) =>
    agent.post('/api/appointments').send({
      patientId,
      startsAt,
      durationMinutes: 45,
      type: 'control',
      modality: 'in_person',
      ...extra,
    });

  const notifications = async (patientId: string) =>
    (await agent.get('/api/notifications').query({ patientId }).expect(200)).body;

  describe('CU-14 WhatsApp notifications', () => {
    it('messages the patient when an appointment is scheduled and logs the delivery', async () => {
      const id = await patient({ phone: '+54 9 11 5555 1234' });
      await schedule(id, '2030-01-20T13:00:00.000Z').expect(201);

      const [log] = await notifications(id);
      expect(log).toMatchObject({
        topic: 'appointment_scheduled',
        status: 'sent',
        attempts: 1,
        recipient: '+54 9 11 5555 1234',
      });
      expect(log.body).toContain('10:00');
      expect(t.whatsapp.sent.at(-1)?.to).toBe('+54 9 11 5555 1234');
    });

    it('skips patients without phone, retries once and never blocks the agenda', async () => {
      const noPhone = await patient();
      await schedule(noPhone, '2030-01-21T13:00:00.000Z').expect(201);
      expect((await notifications(noPhone))[0]).toMatchObject({ status: 'skipped', attempts: 0 });

      const flaky = await patient({ phone: '1155551111' });
      t.whatsapp.failNext(1);
      await schedule(flaky, '2030-01-22T13:00:00.000Z').expect(201);
      expect((await notifications(flaky))[0]).toMatchObject({ status: 'sent', attempts: 2 });

      const broken = await patient({ phone: '1155552222' });
      t.whatsapp.failNext(1, true);
      await schedule(broken, '2030-01-23T13:00:00.000Z').expect(201);
      expect((await notifications(broken))[0]).toMatchObject({
        status: 'failed',
        attempts: 1,
        error: 'provider error',
      });
    });

    it('sends one reminder in the 24 hours before the appointment', async () => {
      const id = await patient({ phone: '1155553333' });
      const { body } = await schedule(id, '2030-01-05T13:00:00.000Z').expect(201);

      await t.runJob('appointments.send-reminders');
      expect(
        (await notifications(id)).some(
          (n: { topic: string }) => n.topic === 'appointment_reminder',
        ),
      ).toBe(false);

      t.clock.set(new Date('2030-01-04T15:00:00.000Z'));
      await t.runJob('appointments.send-reminders');
      await t.runJob('appointments.send-reminders');
      const reminders = (await notifications(id)).filter(
        (n: { topic: string }) => n.topic === 'appointment_reminder',
      );
      expect(reminders).toHaveLength(1);
      expect(reminders[0].body).toContain('Reminder');

      await agent
        .put(`/api/appointments/${body.id}`)
        .send({
          startsAt: '2030-01-05T14:00:00.000Z',
          durationMinutes: 45,
          type: 'control',
          modality: 'in_person',
        })
        .expect(200);
      await t.runJob('appointments.send-reminders');
      const after = (await notifications(id)).filter(
        (n: { topic: string }) => n.topic === 'appointment_reminder',
      );
      expect(after).toHaveLength(1);
      expect(
        (await notifications(id)).some(
          (n: { topic: string }) => n.topic === 'appointment_rescheduled',
        ),
      ).toBe(true);
    });

    it('only lists notifications of the professional', async () => {
      const id = await patient({ phone: '1155554444' });
      await schedule(id, '2030-01-24T13:00:00.000Z').expect(201);
      const other = await t.loggedInAgent();
      const { body } = await other.get('/api/notifications').query({ patientId: id }).expect(200);
      expect(body).toEqual([]);
    });
  });

  describe('CU-15 Virtual consultation', () => {
    it('creates the call for a virtual appointment, sends the link and reuses it', async () => {
      const id = await patient({ phone: '1155555555' });
      const { body: appointment } = await schedule(id, '2030-01-25T13:00:00.000Z', {
        modality: 'virtual',
      }).expect(201);

      const first = await agent
        .post('/api/virtual-meetings')
        .send({ patientId: id, appointmentId: appointment.id })
        .expect(201);
      expect(first.body).toMatchObject({
        appointmentId: appointment.id,
        provider: 'jitsi',
        invitationStatus: 'sent',
      });
      expect(first.body.joinUrl).toMatch(/^https:\/\/meet\.jit\.si\/Mentora-[0-9a-f]{24}$/);
      expect(t.whatsapp.sent.at(-1)?.body).toContain(first.body.joinUrl);

      const again = await agent
        .post('/api/virtual-meetings')
        .send({ patientId: id, appointmentId: appointment.id })
        .expect(201);
      expect(again.body.id).toBe(first.body.id);

      const byAppointment = await agent
        .get('/api/virtual-meetings')
        .query({ appointmentId: appointment.id })
        .expect(200);
      expect(byAppointment.body).toHaveLength(1);
    });

    it('creates one call when it is started twice at the same time', async () => {
      const id = await patient({ phone: '1155556666' });
      const { body: appointment } = await schedule(id, '2030-01-27T13:00:00.000Z', {
        modality: 'virtual',
      }).expect(201);
      const sentBefore = t.whatsapp.sent.length;

      const start = () =>
        agent.post('/api/virtual-meetings').send({ patientId: id, appointmentId: appointment.id });
      const [a, b] = await Promise.all([start(), start()]);

      expect([a.status, b.status]).toEqual([201, 201]);
      expect(a.body.id).toBe(b.body.id);
      expect(t.whatsapp.sent.length - sentBefore).toBe(1);
    });

    it('starts a call from the patient file and keeps the history', async () => {
      const id = await patient();
      const started = await agent.post('/api/virtual-meetings').send({ patientId: id }).expect(201);
      expect(started.body).toMatchObject({ appointmentId: null, invitationStatus: 'skipped' });

      const history = await agent.get('/api/virtual-meetings').query({ patientId: id }).expect(200);
      expect(history.body.map((m: { id: string }) => m.id)).toEqual([started.body.id]);
      await agent.get('/api/virtual-meetings').expect(400);
    });

    it('rejects in-person appointments and foreign patients', async () => {
      const id = await patient();
      const { body: inPerson } = await schedule(id, '2030-01-26T13:00:00.000Z').expect(201);
      const wrongModality = await agent
        .post('/api/virtual-meetings')
        .send({ patientId: id, appointmentId: inPerson.id });
      expect(wrongModality.status).toBe(400);

      const other = await t.loggedInAgent();
      await other.post('/api/virtual-meetings').send({ patientId: id }).expect(404);
    });
  });

  describe('CU-07 automatic inactivation', () => {
    it('inactivates patients after three months without consultations', async () => {
      const dormant = await patient();
      const treated = await patient();
      await agent.put('/api/subscription/plan').send({ planId: 'annual' }).expect(200);
      t.clock.set(new Date('2030-01-10T12:00:00.000Z'));
      await agent
        .post('/api/subscription/payments')
        .send({ amount: 250000, paidAt: '2030-01-10', method: 'bank_transfer' })
        .expect(201);
      await agent.get('/api/auth/me').expect(200);

      t.clock.set(new Date('2030-03-15T12:00:00.000Z'));
      await agent
        .post(`/api/patients/${treated}/clinical-record/consultations`)
        .send({ date: '2030-03-15T12:00:00.000Z', type: 'in_person', reason: 'Control' })
        .expect(201);

      t.clock.set(new Date('2030-04-02T12:00:00.000Z'));
      await t.runJob('patients.inactivate-dormant');

      const inactive = (await agent.get(`/api/patients/${dormant}`)).body;
      expect(inactive).toMatchObject({ status: 'inactive', statusOrigin: 'automatic' });
      const active = (await agent.get(`/api/patients/${treated}`)).body;
      expect(active).toMatchObject({
        status: 'active',
        lastConsultationAt: '2030-03-15T12:00:00.000Z',
      });

      await agent.patch(`/api/patients/${dormant}/status`).send({ status: 'active' }).expect(200);
      await t.runJob('patients.inactivate-dormant');
      expect((await agent.get(`/api/patients/${dormant}`)).body.status).toBe('active');
    });
  });
});
