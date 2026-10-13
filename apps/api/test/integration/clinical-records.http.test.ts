import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Agent, TestApp } from '../support/TestApp';

describe('Clinical record API (CU-08, CU-09, CU-11, CU-12)', () => {
  let t: TestApp;
  let agent: Agent;
  let patientId: string;
  let base: string;

  beforeAll(async () => {
    t = await TestApp.start();
    agent = await t.loggedInAgent();
    const { body } = await agent
      .post('/api/patients')
      .send({ firstName: 'Clara', lastName: 'Ruiz', dni: '35666777' })
      .expect(201);
    patientId = body.id;
    base = `/api/patients/${patientId}/clinical-record`;
  });

  afterAll(async () => {
    await t.stop();
  });

  it('CU-11 searches the read-only DSM-5 catalog by name or code', async () => {
    const byName = await agent
      .get('/api/diagnoses')
      .query({ q: 'generalized anxiety' })
      .expect(200);
    const byCode = await agent.get('/api/diagnoses').query({ q: 'F32' }).expect(200);

    expect(byName.body).toEqual([
      { code: 'F41.1', name: 'Generalized anxiety disorder', category: 'Anxiety disorders' },
    ]);
    expect(byCode.body.length).toBeGreaterThanOrEqual(3);
  });

  it('CU-08 an empty record is returned when there are no consultations', async () => {
    const response = await agent.get(base).expect(200);
    expect(response.body).toMatchObject({ patientId, consultations: [] });
  });

  it('CU-09 registers a consultation with evolution, DSM-5 diagnosis and medications', async () => {
    const response = await agent.post(`${base}/consultations`).send({
      date: '2030-01-05T15:00:00.000Z',
      type: 'in_person',
      reason: 'Persistent worry and insomnia',
      evolution: 'Reports improvement in sleep',
      diagnosisCode: 'f41.1',
      medications: [
        { name: 'Sertraline', dose: '50 mg', frequency: 'Once a day', duration: '3 months' },
        {
          name: 'Clonazepam',
          dose: '0.5 mg',
          frequency: 'At night',
          duration: '2 weeks',
          indications: 'Only if needed',
        },
      ],
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      reason: 'Persistent worry and insomnia',
      diagnosis: { code: 'F41.1', name: 'Generalized anxiety disorder' },
      medications: [{ name: 'Sertraline' }, { name: 'Clonazepam', indications: 'Only if needed' }],
    });
  });

  it('CU-09 accepts a consultation without evolution nor diagnosis', async () => {
    await agent
      .post(`${base}/consultations`)
      .send({ date: '2030-02-05T15:00:00.000Z', type: 'virtual', reason: 'Control' })
      .expect(201);
  });

  it('CU-11 rejects diagnoses outside the catalog; CU-12 requires medication fields', async () => {
    const unknown = await agent.post(`${base}/consultations`).send({
      date: '2030-01-05T15:00:00.000Z',
      type: 'in_person',
      reason: 'x',
      diagnosisCode: 'Z99',
    });
    const incompleteMedication = await agent.post(`${base}/consultations`).send({
      date: '2030-01-05T15:00:00.000Z',
      type: 'in_person',
      reason: 'x',
      medications: [{ name: 'Sertraline' }],
    });

    expect(unknown.status).toBe(400);
    expect(unknown.body.error.details.field).toBe('diagnosisCode');
    expect(incompleteMedication.status).toBe(400);
  });

  it('CU-08 lists consultations newest first and shows the detail of one', async () => {
    const record = await agent.get(base).expect(200);
    const [latest, first] = record.body.consultations;

    expect(record.body.consultations).toHaveLength(2);
    expect(latest).toMatchObject({ type: 'virtual', diagnosis: null, medicationCount: 0 });
    expect(first).toMatchObject({ diagnosis: { code: 'F41.1' }, medicationCount: 2 });

    const detail = await agent.get(`${base}/consultations/${first.id}`).expect(200);
    expect(detail.body.evolution).toBe('Reports improvement in sleep');
  });

  it('CU-11 keeps the diagnosis history', async () => {
    await agent
      .post(`${base}/consultations`)
      .send({
        date: '2030-03-05T15:00:00.000Z',
        type: 'in_person',
        reason: 'Low mood',
        diagnosisCode: 'F32.1',
      })
      .expect(201);

    const history = await agent.get(`${base}/diagnoses`).expect(200);
    expect(history.body.map((h: { diagnosis: { code: string } }) => h.diagnosis.code)).toEqual([
      'F32.1',
      'F41.1',
    ]);
  });

  it("answers 404 for another professional's patient", async () => {
    const other = await t.loggedInAgent();
    await other.get(base).expect(404);
    await other
      .post(`${base}/consultations`)
      .send({ date: '2030-01-05T15:00:00.000Z', type: 'in_person', reason: 'x' })
      .expect(404);
  });
});
