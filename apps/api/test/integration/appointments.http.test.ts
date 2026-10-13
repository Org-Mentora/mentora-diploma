import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Agent, TestApp } from '../support/TestApp';

describe('Appointments API (CU-10)', () => {
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
    agent.post('/api/appointments').send({
      patientId,
      startsAt,
      durationMinutes: 45,
      type: 'control',
      modality: 'in_person',
      ...extra,
    });

  it('schedules an appointment with the patient name', async () => {
    const response = await schedule('2030-01-10T13:00:00.000Z', { notes: 'Bring lab results' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      patientName: 'Tomás Silva',
      endsAt: '2030-01-10T13:45:00.000Z',
      status: 'scheduled',
      notes: 'Bring lab results',
    });
  });

  it('rejects an overlapping slot with 409 and a past slot with 400', async () => {
    const overlap = await schedule('2030-01-10T13:30:00.000Z');
    const past = await schedule('2029-12-01T13:00:00.000Z');

    expect(overlap.status).toBe(409);
    expect(past.status).toBe(400);
  });

  it('lists the month ordered by start time', async () => {
    await schedule('2030-01-08T09:00:00.000Z', { type: 'first_visit', modality: 'virtual' }).expect(
      201,
    );
    await schedule('2030-02-01T09:00:00.000Z').expect(201);

    const january = await agent
      .get('/api/appointments')
      .query({ from: '2030-01-01T00:00:00.000Z', to: '2030-02-01T00:00:00.000Z' })
      .expect(200);

    expect(january.body.map((a: { startsAt: string }) => a.startsAt)).toEqual([
      '2030-01-08T09:00:00.000Z',
      '2030-01-10T13:00:00.000Z',
    ]);
  });

  it('rejects ranges longer than 62 days', async () => {
    await agent
      .get('/api/appointments')
      .query({ from: '2030-01-01T00:00:00.000Z', to: '2030-06-01T00:00:00.000Z' })
      .expect(400);
  });

  it('reschedules checking availability, then cancels and frees the slot', async () => {
    const { body: appointment } = await schedule('2030-01-15T10:00:00.000Z').expect(201);
    await schedule('2030-01-15T11:00:00.000Z').expect(201);

    const clash = await agent.put(`/api/appointments/${appointment.id}`).send({
      startsAt: '2030-01-15T11:15:00.000Z',
      durationMinutes: 30,
      type: 'follow_up',
      modality: 'in_person',
    });
    expect(clash.status).toBe(409);

    const moved = await agent
      .put(`/api/appointments/${appointment.id}`)
      .send({
        startsAt: '2030-01-15T09:00:00.000Z',
        durationMinutes: 60,
        type: 'follow_up',
        modality: 'virtual',
      })
      .expect(200);
    expect(moved.body).toMatchObject({ type: 'follow_up', endsAt: '2030-01-15T10:00:00.000Z' });

    const cancelled = await agent.post(`/api/appointments/${appointment.id}/cancel`).expect(200);
    expect(cancelled.body.status).toBe('cancelled');
    await agent.post(`/api/appointments/${appointment.id}/cancel`).expect(409);
    await schedule('2030-01-15T09:00:00.000Z').expect(201);
  });

  it('answers 404 for unknown patients and for other professionals', async () => {
    const { body: appointment } = await schedule('2030-01-20T10:00:00.000Z').expect(201);
    const other = await t.loggedInAgent();

    await schedule('2030-01-21T10:00:00.000Z', {
      patientId: '7f1a2b3c-0000-4000-8000-000000000000',
    }).expect(404);
    await other.get(`/api/appointments/${appointment.id}`).expect(404);
    await other
      .post('/api/appointments')
      .send({
        patientId,
        startsAt: '2030-01-22T10:00:00.000Z',
        durationMinutes: 30,
        type: 'control',
        modality: 'in_person',
      })
      .expect(404);
  });
});
