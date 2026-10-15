import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AuthGuard } from '#infrastructure/http/AuthGuard';
import { SessionCookie } from '#infrastructure/http/SessionCookie';
import { Logger } from '#infrastructure/logger/Logger';
import { OpenApiRegistry } from '#infrastructure/openapi/OpenApiRegistry';
import { JoseTokenService } from '#infrastructure/security/JoseTokenService';
import { ScryptPasswordHasher } from '#infrastructure/security/ScryptPasswordHasher';
import { AppointmentsModule } from '#modules/appointments';
import { AuthModule } from '#modules/auth';
import { ClinicalRecordsModule } from '#modules/clinical-records';
import { DiagnosisCatalogModule } from '#modules/diagnosis-catalog';
import { PatientsModule } from '#modules/patients';
import { Application } from '../../src/app/Application';
import {
  InMemoryAppointmentRepository,
  InMemoryClinicalRecordRepository,
  InMemoryDiagnosisCatalogRepository,
  InMemoryPatientRepository,
  InMemoryProfessionalRepository,
  SpyNotifier,
  SpySeeder,
} from '../support/inMemory';
import { type Agent, MutableClock, TestApp } from '../support/TestApp';

const SESSION_TTL_SECONDS = 3_600;
const TRIAL_DAYS = 14;
const TEST_JWT_SECRET = 'in-memory-test-secret-0123456789-abcdef';

/** Every module wired to in-memory adapters: no MongoDB is started. */
function buildApplication(notifier: SpyNotifier, seeder: SpySeeder): Application {
  const clock = new MutableClock(TestApp.START);
  const tokens = new JoseTokenService(TEST_JWT_SECRET, SESSION_TTL_SECONDS);
  const guard = new AuthGuard(tokens, clock);
  const patients = new PatientsModule({
    guard,
    clock,
    repository: new InMemoryPatientRepository(),
  });
  const diagnoses = new DiagnosisCatalogModule({
    guard,
    seeder,
    repository: InMemoryDiagnosisCatalogRepository.with({
      code: 'F41.1',
      name: 'Generalized anxiety disorder',
      category: 'Anxiety disorders',
    }),
  });

  return new Application([
    new AuthModule({
      guard,
      cookie: new SessionCookie(false, SESSION_TTL_SECONDS),
      hasher: new ScryptPasswordHasher(),
      tokens,
      clock,
      trialDays: TRIAL_DAYS,
      repository: new InMemoryProfessionalRepository(),
    }),
    patients,
    diagnoses,
    new ClinicalRecordsModule({
      guard,
      clock,
      patients: patients.directory,
      catalog: diagnoses.catalog,
      repository: new InMemoryClinicalRecordRepository(),
    }),
    new AppointmentsModule({
      guard,
      clock,
      patients: patients.directory,
      logger: Logger.getInstance(),
      repository: new InMemoryAppointmentRepository(),
      notifier,
    }),
  ]);
}

describe('API on in-memory adapters (dependency inversion)', () => {
  const notifier = new SpyNotifier();
  const seeder = new SpySeeder();
  let agent: Agent;
  let patientId: string;

  beforeAll(async () => {
    OpenApiRegistry.resetInstance();
    const application = buildApplication(notifier, seeder);
    await application.bootstrapModules();
    agent = request.agent(application.createServer({ quiet: true }).app);
    await agent.post('/api/auth/register').send(TestApp.professional()).expect(201);
    const { body } = await agent
      .post('/api/patients')
      .send({ firstName: 'Lucía', lastName: 'Fernández', dni: '28111222' })
      .expect(201);
    patientId = body.id;
  });

  afterAll(() => {
    OpenApiRegistry.resetInstance();
  });

  it('runs the injected catalog seeder once on bootstrap', () => {
    expect(seeder.runs).toBe(1);
  });

  it('searches patients through the injected repository', async () => {
    const response = await agent.get('/api/patients').query({ q: 'lucia' }).expect(200);

    expect(response.body.map((p: { fullName: string }) => p.fullName)).toEqual(['Lucía Fernández']);
  });

  it('resolves diagnoses from the injected catalog into the clinical record', async () => {
    const response = await agent
      .post(`/api/patients/${patientId}/clinical-record/consultations`)
      .send({
        date: '2030-01-05T15:00:00.000Z',
        type: 'in_person',
        reason: 'Persistent worry',
        diagnosisCode: 'f41.1',
      })
      .expect(201);

    expect(response.body.diagnosis).toMatchObject({ code: 'F41.1' });
  });

  it('sends agenda changes through the injected notifier', async () => {
    const { body: appointment } = await agent
      .post('/api/appointments')
      .send({
        patientId,
        startsAt: '2030-01-10T13:00:00.000Z',
        durationMinutes: 45,
        type: 'control',
        modality: 'in_person',
      })
      .expect(201);
    await agent.post(`/api/appointments/${appointment.id}/cancel`).expect(200);

    expect(notifier.sent).toEqual([
      { event: 'scheduled', appointmentId: appointment.id },
      { event: 'cancelled', appointmentId: appointment.id },
    ]);
  });
});
