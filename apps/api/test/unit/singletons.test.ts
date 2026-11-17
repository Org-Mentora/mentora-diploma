import { Writable } from 'node:stream';
import { pino } from 'pino';
import { afterEach, describe, expect, it } from 'vitest';
import { AppConfig } from '#infrastructure/config/AppConfig';
import { MongoConnection } from '#infrastructure/database/MongoConnection';
import { Logger } from '#infrastructure/logger/Logger';
import { OpenApiRegistry } from '#infrastructure/openapi/OpenApiRegistry';

describe('Singletons (ADR-0006)', () => {
  afterEach(() => {
    AppConfig.resetInstance();
    OpenApiRegistry.resetInstance();
  });

  it.each([
    ['AppConfig', () => AppConfig.getInstance()],
    ['MongoConnection', () => MongoConnection.getInstance()],
    ['OpenApiRegistry', () => OpenApiRegistry.getInstance()],
  ])('%s always returns the same instance', (_name, get) => {
    expect(get()).toBe(get());
  });

  it('AppConfig validates the environment once and exposes typed values', () => {
    process.env.PORT = '4321';
    AppConfig.resetInstance();
    expect(AppConfig.getInstance().env.PORT).toBe(4321);
    delete process.env.PORT;
  });

  it('Logger redacts the session cookie from request and response logs', () => {
    const lines: string[] = [];
    const sink = new Writable({
      write(chunk, _encoding, done) {
        lines.push(String(chunk));
        done();
      },
    });
    const log = pino({ redact: Logger.REDACTED_PATHS }, sink);

    log.info({
      req: { headers: { cookie: 'mentora_session=jwt', authorization: 'Bearer jwt' } },
      res: { headers: { 'set-cookie': 'mentora_session=jwt' } },
    });

    expect(lines.join('')).not.toContain('jwt');
    expect(lines.join('')).toContain('[Redacted]');
  });
});
