import { randomUUID } from 'node:crypto';
import type { Express } from 'express';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { Clock } from '#core/model/Clock';
import { AppConfig } from '#infrastructure/config/AppConfig';
import { MigrationLog } from '#infrastructure/database/MigrationLog';
import { MongoConnection } from '#infrastructure/database/MongoConnection';
import { OpenApiRegistry } from '#infrastructure/openapi/OpenApiRegistry';
import { Application } from '../../src/app/Application';
import { createModules } from '../../src/app/modules';
import { CapturingMailTransport, RecordingWhatsApp } from './fakes';

const DAY_MS = 24 * 60 * 60 * 1000;

export class MutableClock extends Clock {
  constructor(private current: Date) {
    super();
  }

  now(): Date {
    return new Date(this.current);
  }

  advanceDays(days: number): void {
    this.current = new Date(this.current.getTime() + days * DAY_MS);
  }

  advanceMinutes(minutes: number): void {
    this.current = new Date(this.current.getTime() + minutes * 60_000);
  }

  set(date: Date): void {
    this.current = new Date(date);
  }
}

export type Agent = ReturnType<typeof request.agent>;

export class TestApp {
  static readonly START = new Date('2030-01-01T12:00:00.000Z');

  private constructor(
    readonly app: Express,
    readonly clock: MutableClock,
    readonly mail: CapturingMailTransport,
    readonly whatsapp: RecordingWhatsApp,
    private readonly application: Application,
    private readonly mongo: MongoMemoryReplSet,
  ) {}

  static async start(): Promise<TestApp> {
    AppConfig.resetInstance();
    OpenApiRegistry.resetInstance();
    const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await MongoConnection.getInstance().connect(mongo.getUri());

    const clock = new MutableClock(TestApp.START);
    const mail = new CapturingMailTransport();
    const whatsapp = new RecordingWhatsApp();
    const application = new Application(createModules({ clock, mail, whatsapp }));
    await application.bootstrapModules();
    await application.runMigrations();
    return new TestApp(
      application.createServer({ quiet: true }).app,
      clock,
      mail,
      whatsapp,
      application,
      mongo,
    );
  }

  agent(): Agent {
    return request.agent(this.app);
  }

  async rerunMigrations(): Promise<string[]> {
    await mongoose.connection.collection(MigrationLog.COLLECTION).deleteMany({});
    return this.application.runMigrations();
  }

  runMigrations(): Promise<string[]> {
    return this.application.runMigrations();
  }

  async runJob(name: string): Promise<void> {
    const job = this.application.scheduledJobs().find((j) => j.name === name);
    if (!job) {
      throw new Error(`Unknown job ${name}`);
    }
    await job.run();
  }

  async loggedInAgent(overrides: Record<string, unknown> = {}): Promise<Agent> {
    const agent = this.agent();
    await agent.post('/api/auth/register').send(TestApp.professional(overrides)).expect(201);
    return agent;
  }

  static professional(overrides: Record<string, unknown> = {}) {
    const unique = randomUUID().slice(0, 8);
    return {
      firstName: 'Ana',
      lastName: 'García',
      email: `ana.${unique}@mentora.test`,
      phone: '+54 11 5555 0000',
      specialty: 'Psychiatry',
      licenseNumber: `MN-${unique}`,
      password: 'Secret123',
      ...overrides,
    };
  }

  async stop(): Promise<void> {
    await MongoConnection.getInstance().disconnect();
    await this.mongo.stop();
    OpenApiRegistry.resetInstance();
  }
}
