import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TransactionContext } from '#infrastructure/database/TransactionContext';
import { DateTimeFormatter } from '#infrastructure/format/DateTimeFormatter';
import { AuthGuard } from '#infrastructure/http/AuthGuard';
import { RateLimiter } from '#infrastructure/http/RateLimiter';
import { SessionCookie } from '#infrastructure/http/SessionCookie';
import { Logger } from '#infrastructure/logger/Logger';
import { OpenApiRegistry } from '#infrastructure/openapi/OpenApiRegistry';
import { HmacSha256SigningAlgorithm } from '#infrastructure/security/HmacSha256SigningAlgorithm';
import { JoseTokenService } from '#infrastructure/security/JoseTokenService';
import { ScryptPasswordHasher } from '#infrastructure/security/ScryptPasswordHasher';
import { AppointmentsModule } from '#modules/appointments';
import { AuthModule } from '#modules/auth';
import { ClinicalRecordsModule } from '#modules/clinical-records';
import { DiagnosisCatalogModule } from '#modules/diagnosis-catalog';
import { NotificationsModule } from '#modules/notifications';
import { PatientsModule } from '#modules/patients';
import { SimulatedPaymentGateway, SubscriptionsModule } from '#modules/subscriptions';
import {
  JitsiMeetingLinkProvider,
  VirtualConsultationsModule,
} from '#modules/virtual-consultations';
import { Application } from '../../src/app/Application';
import { CapturingMailTransport, RecordingWhatsApp } from '../support/fakes';
import {
  InMemoryAppointmentRepository,
  InMemoryClinicalRecordRepository,
  InMemoryDiagnosisCatalogRepository,
  InMemoryLogoRepository,
  InMemoryNotificationRepository,
  InMemoryPasswordRecoveryRepository,
  InMemoryPatientRepository,
  InMemoryPaymentRepository,
  InMemoryProfessionalRepository,
  InMemoryRateLimitStore,
  InMemoryRecordAccessLog,
  InMemorySubscriptionRepository,
  InMemoryTransactionManager,
  InMemoryVirtualMeetingRepository,
  SpyAgendaLock,
  SpyNotifier,
  SpySeeder,
} from '../support/inMemory';
import { type Agent, MutableClock, TestApp } from '../support/TestApp';

const SESSION_TTL_SECONDS = 3_600;
const TRIAL_DAYS = 14;
const TEST_JWT_SECRET = 'in-memory-test-secret-0123456789-abcdef';

interface Fakes {
  lock: SpyAgendaLock;
  notifier: SpyNotifier;
  seeder: SpySeeder;
  transactions: InMemoryTransactionManager;
  whatsapp: RecordingWhatsApp;
}

function buildApplication(fakes: Fakes): Application {
  const clock = new MutableClock(TestApp.START);
  const tokens = new JoseTokenService(
    new HmacSha256SigningAlgorithm(TEST_JWT_SECRET),
    SESSION_TTL_SECONDS,
  );
  const guard = new AuthGuard(tokens, clock);
  const logger = Logger.getInstance();
  const context = new TransactionContext();
  const dates = new DateTimeFormatter('America/Argentina/Buenos_Aires');
  const mail = new CapturingMailTransport();
  const { transactions } = fakes;

  const subscriptions = new SubscriptionsModule({
    guard,
    clock,
    transactions,
    context,
    gateway: new SimulatedPaymentGateway(),
    mail,
    dates,
    logger,
    prices: { monthly: 25_000, annual: 250_000 },
    trialDays: TRIAL_DAYS,
    planUrl: 'http://localhost/settings/plan',
    subscriptions: new InMemorySubscriptionRepository(),
    payments: new InMemoryPaymentRepository(),
  });
  const patients = new PatientsModule({
    guard,
    clock,
    transactions,
    context,
    logger,
    repository: new InMemoryPatientRepository(),
  });
  const diagnoses = new DiagnosisCatalogModule({
    guard,
    seeder: fakes.seeder,
    repository: InMemoryDiagnosisCatalogRepository.with({
      code: 'F41.1',
      name: 'Generalized anxiety disorder',
      category: 'Anxiety disorders',
    }),
  });
  const notifications = new NotificationsModule({
    guard,
    clock,
    context,
    whatsapp: fakes.whatsapp,
    mail,
    repository: new InMemoryNotificationRepository(),
  });
  const appointments = new AppointmentsModule({
    guard,
    clock,
    patients: patients.directory,
    notifications: notifications.center,
    dates,
    logger,
    transactions,
    context,
    repository: new InMemoryAppointmentRepository(),
    notifier: fakes.notifier,
    lock: fakes.lock,
  });

  return new Application([
    new AuthModule({
      guard,
      cookie: new SessionCookie(false, SESSION_TTL_SECONDS),
      hasher: new ScryptPasswordHasher(),
      tokens,
      clock,
      transactions,
      context,
      subscriptions: subscriptions.access,
      mail,
      dates,
      logger,
      recoveryUrl: 'http://localhost/forgot-password',
      limiter: new RateLimiter(false, new InMemoryRateLimitStore()),
      professionals: new InMemoryProfessionalRepository(),
      recoveries: new InMemoryPasswordRecoveryRepository(),
      logos: new InMemoryLogoRepository(),
    }),
    subscriptions,
    patients,
    diagnoses,
    new ClinicalRecordsModule({
      guard,
      clock,
      patients: patients.directory,
      activity: patients.activity,
      catalog: diagnoses.catalog,
      transactions,
      context,
      repository: new InMemoryClinicalRecordRepository(),
      accessLog: new InMemoryRecordAccessLog(),
    }),
    appointments,
    notifications,
    new VirtualConsultationsModule({
      guard,
      clock,
      transactions,
      context,
      links: new JitsiMeetingLinkProvider('https://meet.jit.si'),
      patients: patients.directory,
      appointments: appointments.directory,
      notifications: notifications.center,
      repository: new InMemoryVirtualMeetingRepository(),
    }),
  ]);
}

describe('API on in-memory adapters (dependency inversion)', () => {
  const fakes: Fakes = {
    lock: new SpyAgendaLock(),
    notifier: new SpyNotifier(),
    seeder: new SpySeeder(),
    transactions: new InMemoryTransactionManager(),
    whatsapp: new RecordingWhatsApp(),
  };
  let application: Application;
  let agent: Agent;
  let patientId: string;

  beforeAll(async () => {
    OpenApiRegistry.resetInstance();
    application = buildApplication(fakes);
    await application.bootstrapModules();
    agent = request.agent(application.createServer({ quiet: true }).app);
    await agent.post('/api/auth/register').send(TestApp.professional()).expect(201);
    const { body } = await agent
      .post('/api/patients')
      .send({
        firstName: 'Lucía',
        lastName: 'Fernández',
        dni: '28111222',
        phone: '+54 11 5555 0000',
      })
      .expect(201);
    patientId = body.id;
  });

  afterAll(() => {
    OpenApiRegistry.resetInstance();
  });

  it('runs the injected catalog seeder once on bootstrap', () => {
    expect(fakes.seeder.runs).toBe(1);
  });

  it('starts the trial through the injected subscription repository', async () => {
    const response = await agent.get('/api/subscription').expect(200);

    expect(response.body).toMatchObject({ status: 'trial' });
  });

  it('searches patients through the injected repository', async () => {
    const response = await agent.get('/api/patients').query({ q: 'lucia' }).expect(200);

    expect(response.body.map((p: { fullName: string }) => p.fullName)).toEqual(['Lucía Fernández']);
  });

  it('resolves diagnoses from the injected catalog into the clinical record', async () => {
    const response = await agent
      .post(`/api/patients/${patientId}/clinical-record/consultations`)
      .send({
        date: '2030-01-01T10:00:00.000Z',
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

    expect(fakes.lock.acquired).toHaveLength(1);
    expect(fakes.notifier.sent).toEqual([
      { event: 'scheduled', appointmentId: appointment.id },
      { event: 'cancelled', appointmentId: appointment.id },
    ]);
  });

  it('invites the patient to a video call through the in-memory notification log', async () => {
    const meeting = await agent.post('/api/virtual-meetings').send({ patientId }).expect(201);
    const log = await agent.get('/api/notifications').query({ patientId }).expect(200);

    expect(meeting.body.joinUrl).toMatch(/^https:\/\/meet\.jit\.si\//);
    expect(fakes.whatsapp.sent.at(-1)?.body).toContain(meeting.body.joinUrl);
    expect(log.body[0]).toMatchObject({ status: 'sent' });
  });

  it('runs every write through the injected transaction manager, never MongoDB', async () => {
    for (const job of application.scheduledJobs()) {
      await job.run();
    }

    expect(fakes.transactions.runs).toBeGreaterThan(0);
    expect(mongoose.connection.readyState).toBe(0);
  });
});
