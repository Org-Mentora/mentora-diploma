import { randomUUID } from 'node:crypto';
import type { Express } from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { Clock } from '#core/model/Clock';
import { AppConfig } from '#infrastructure/config/AppConfig';
import { MongoConnection } from '#infrastructure/database/MongoConnection';
import { OpenApiRegistry } from '#infrastructure/openapi/OpenApiRegistry';
import { Application } from '../../src/app/Application';
import { createModules } from '../../src/app/modules';

const DAY_MS = 24 * 60 * 60 * 1000;

/** A clock tests can move forward (e.g. to expire the free trial). */
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
}

export type Agent = ReturnType<typeof request.agent>;

/** Full API on an in-memory MongoDB, with helpers to get an authenticated agent. */
export class TestApp {
  static readonly START = new Date('2030-01-01T12:00:00.000Z');

  private constructor(
    readonly app: Express,
    readonly clock: MutableClock,
    private readonly mongo: MongoMemoryServer,
  ) {}

  static async start(): Promise<TestApp> {
    AppConfig.resetInstance();
    OpenApiRegistry.resetInstance();
    const mongo = await MongoMemoryServer.create();
    await MongoConnection.getInstance().connect(mongo.getUri());

    const clock = new MutableClock(TestApp.START);
    const application = new Application(createModules({ clock }));
    await application.bootstrapModules();
    return new TestApp(application.createServer({ quiet: true }).app, clock, mongo);
  }

  agent(): Agent {
    return request.agent(this.app);
  }

  /** Registers a new professional (CU-03) and returns an agent holding the session cookie. */
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
