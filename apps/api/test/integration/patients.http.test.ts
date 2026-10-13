import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Agent, TestApp } from '../support/TestApp';

describe('Patients API (CU-04..CU-07)', () => {
  let t: TestApp;
  let agent: Agent;

  beforeAll(async () => {
    t = await TestApp.start();
    agent = await t.loggedInAgent();
  });

  afterAll(async () => {
    await t.stop();
  });

  const create = (body: Record<string, unknown>) => agent.post('/api/patients').send(body);

  it('CU-04 registers a patient with only names and DNI, as active', async () => {
    const response = await create({ firstName: 'Lucía', lastName: 'Fernández', dni: '28.111.222' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      fullName: 'Lucía Fernández',
      dni: '28111222',
      status: 'active',
      statusOrigin: 'manual',
      allergies: [],
    });
  });

  it('CU-04 rejects a duplicated DNI and missing fields', async () => {
    await create({ firstName: 'Dup', lastName: 'One', dni: '33444555' }).expect(201);

    const duplicate = await create({ firstName: 'Dup', lastName: 'Two', dni: '33.444.555' });
    const missing = await create({ firstName: 'No DNI', lastName: 'Patient' });

    expect(duplicate.status).toBe(409);
    expect(missing.status).toBe(400);
  });

  it('CU-05 searches by name, surname or DNI ignoring accents; empty lists all', async () => {
    await create({ firstName: 'Martín', lastName: 'Gómez', dni: '40111222' }).expect(201);

    const byAccentless = await agent.get('/api/patients').query({ q: 'martin gomez' }).expect(200);
    const byDni = await agent.get('/api/patients').query({ q: '40111' }).expect(200);
    const none = await agent.get('/api/patients').query({ q: 'zzz' }).expect(200);
    const all = await agent.get('/api/patients').expect(200);

    expect(byAccentless.body.map((p: { fullName: string }) => p.fullName)).toEqual([
      'Martín Gómez',
    ]);
    expect(byDni.body).toHaveLength(1);
    expect(none.body).toEqual([]);
    expect(all.body.length).toBeGreaterThanOrEqual(3);
  });

  it('CU-06 updates personal, administrative and clinical data', async () => {
    const { body: patient } = await create({ firstName: 'Old', lastName: 'Name', dni: '25999888' });

    const response = await agent.put(`/api/patients/${patient.id}`).send({
      firstName: 'New',
      lastName: 'Name',
      dni: '25999888',
      birthDate: '1985-03-20',
      phone: '+54 11 4444 1111',
      healthInsurance: 'OSDE',
      memberNumber: '123-45',
      familyContact: { name: 'María Name', phone: '+54 11 4444 2222' },
      debt: 1500,
      allergies: ['Penicillin'],
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      fullName: 'New Name',
      birthDate: '1985-03-20',
      age: 44,
      familyContact: { name: 'María Name' },
      allergies: ['Penicillin'],
      debt: 1500,
    });
  });

  it('CU-07 discharges and reactivates a patient; inactive cannot be set manually', async () => {
    const { body: patient } = await create({
      firstName: 'Status',
      lastName: 'Flow',
      dni: '29000111',
    });

    const discharged = await agent
      .patch(`/api/patients/${patient.id}/status`)
      .send({ status: 'discharged' })
      .expect(200);
    expect(discharged.body.status).toBe('discharged');

    await agent.patch(`/api/patients/${patient.id}/status`).send({ status: 'active' }).expect(200);
    await agent
      .patch(`/api/patients/${patient.id}/status`)
      .send({ status: 'inactive' })
      .expect(400);
  });

  it('isolates data between professionals (ADR-0019)', async () => {
    const { body: patient } = await create({
      firstName: 'Private',
      lastName: 'Data',
      dni: '31222333',
    });
    const other = await t.loggedInAgent();

    await other.get(`/api/patients/${patient.id}`).expect(404);
    expect((await other.get('/api/patients').expect(200)).body).toEqual([]);
    // The same DNI can exist for another professional.
    await other
      .post('/api/patients')
      .send({ firstName: 'Same', lastName: 'Dni', dni: '31222333' })
      .expect(201);
  });

  it('answers 404 for unknown patients and 400 for malformed ids', async () => {
    await agent.get('/api/patients/7f1a2b3c-0000-4000-8000-000000000000').expect(404);
    await agent.get('/api/patients/not-a-uuid').expect(400);
  });
});
