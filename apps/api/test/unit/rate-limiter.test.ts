import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { HttpErrorHandler } from '#infrastructure/http/HttpErrorHandler';
import { RateLimiter } from '#infrastructure/http/RateLimiter';

const silent = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  debug: () => undefined,
  child: () => silent,
};

function appWith(limiter: RateLimiter) {
  const app = express();
  app.use(express.json());
  app.post(
    '/login',
    limiter.limit({ name: 'login', limit: 2, windowMs: 60_000, key: RateLimiter.byEmail }),
    (_req, res) => {
      res.status(204).end();
    },
  );
  const errors = new HttpErrorHandler(silent as never);
  app.use(errors.handle);
  return app;
}

describe('RateLimiter', () => {
  it('answers 429 with Retry-After once a key goes over its limit, until the window ends', async () => {
    let now = 0;
    const app = appWith(new RateLimiter(true, () => now));
    const login = (email: string) => request(app).post('/login').send({ email });

    await login('a@b.com').expect(204);
    await login('A@b.com ').expect(204);
    const blocked = await login('a@b.com').expect(429);
    expect(blocked.headers['retry-after']).toBe('60');
    expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');
    await login('other@b.com').expect(204);

    now = 60_000;
    await login('a@b.com').expect(204);
  });

  it('lets everything through when disabled', async () => {
    const app = appWith(new RateLimiter(false));
    for (let i = 0; i < 5; i++) {
      await request(app).post('/login').send({ email: 'a@b.com' }).expect(204);
    }
  });
});
