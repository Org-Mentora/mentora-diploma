import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { OpenApiRegistry } from '#infrastructure/openapi/OpenApiRegistry';
import { Application } from '../../src/app/Application';
import { HealthModule } from '../../src/modules/health/HealthModule';
import { FixedClock, FixedUptime, StubIndicator } from '../support/fakes';

describe('HTTP API', () => {
  let app: ReturnType<Application['createServer']>['app'];

  beforeAll(() => {
    OpenApiRegistry.resetInstance();
    const health = new HealthModule({
      indicators: [new StubIndicator('mongodb', 'up'), new StubIndicator('cache', 'down')],
      clock: new FixedClock(new Date('2026-01-01T00:00:00.000Z')),
      uptime: new FixedUptime(3),
    });
    app = new Application([health]).createServer({ quiet: true }).app;
  });

  afterAll(() => {
    OpenApiRegistry.resetInstance();
  });

  it('GET /api/health renders the health view model', async () => {
    const response = await request(app).get('/api/health').expect(200);

    expect(response.body).toMatchObject({
      status: 'degraded',
      uptimeSeconds: 3,
      components: [
        { name: 'mongodb', status: 'up' },
        { name: 'cache', status: 'down', error: 'stub down' },
      ],
    });
  });

  it('splits liveness from readiness', async () => {
    const live = await request(app).get('/api/health/live').expect(200);
    expect(live.body).toMatchObject({ status: 'ok', components: [] });

    const ready = await request(app).get('/api/health/ready').expect(503);
    expect(ready.body.status).toBe('degraded');
  });

  it('tags every response with a request id, keeping a valid incoming one', async () => {
    const generated = await request(app).get('/api/health/live');
    expect(generated.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);

    const kept = await request(app).get('/api/health/live').set('X-Request-Id', 'trace-42');
    expect(kept.headers['x-request-id']).toBe('trace-42');
  });

  it('unknown routes answer with the standard error body', async () => {
    const response = await request(app).get('/api/nope').expect(404);
    expect(response.body.error.code).toBe('ROUTE_NOT_FOUND');
  });

  it('serves the OpenAPI document that feeds the frontend codegen', async () => {
    const response = await request(app).get('/api/openapi.json').expect(200);

    expect(response.body.paths['/health'].get.operationId).toBe('getHealth');
    expect(Object.keys(response.body.components.schemas)).toEqual(
      expect.arrayContaining(['HealthDto', 'ComponentHealthDto', 'ErrorResponseDto']),
    );
  });
});
