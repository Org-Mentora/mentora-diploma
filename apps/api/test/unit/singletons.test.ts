import { afterEach, describe, expect, it } from 'vitest';
import { AppConfig } from '#infrastructure/config/AppConfig';
import { MongoConnection } from '#infrastructure/database/MongoConnection';
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
});
