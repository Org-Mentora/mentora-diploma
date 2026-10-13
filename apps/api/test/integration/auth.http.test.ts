import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TestApp } from '../support/TestApp';

describe('Auth API (CU-01, CU-03)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await TestApp.start();
  });

  afterAll(async () => {
    await t.stop();
  });

  it('registers a professional, starts the trial and sets an httpOnly session cookie', async () => {
    const response = await t.agent().post('/api/auth/register').send(TestApp.professional());

    expect(response.status).toBe(201);
    expect(response.headers['set-cookie']?.[0]).toMatch(/^mentora_session=.+HttpOnly/);
    expect(response.body.subscription).toMatchObject({ status: 'trial', daysLeft: 14 });
    expect(response.body.professional).not.toHaveProperty('passwordHash');
  });

  it('rejects duplicated email and license number with 409', async () => {
    const data = TestApp.professional();
    await t.agent().post('/api/auth/register').send(data).expect(201);

    const sameEmail = await t
      .agent()
      .post('/api/auth/register')
      .send({ ...TestApp.professional(), email: data.email.toUpperCase() });
    const sameLicense = await t
      .agent()
      .post('/api/auth/register')
      .send({ ...TestApp.professional(), licenseNumber: data.licenseNumber });

    expect(sameEmail.status).toBe(409);
    expect(sameEmail.body.error.details.field).toBe('email');
    expect(sameLicense.status).toBe(409);
  });

  it('rejects weak passwords and incomplete forms with 400', async () => {
    const weak = await t
      .agent()
      .post('/api/auth/register')
      .send(TestApp.professional({ password: 'onlyletters' }));
    const incomplete = await t.agent().post('/api/auth/register').send({ email: 'x@y.z' });

    expect(weak.status).toBe(400);
    expect(weak.body.error.message).toContain('at least one number');
    expect(incomplete.status).toBe(400);
    expect(incomplete.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('logs in, restores the session with /me and logs out', async () => {
    const data = TestApp.professional();
    await t.agent().post('/api/auth/register').send(data).expect(201);

    const agent = t.agent();
    await agent
      .post('/api/auth/login')
      .send({ email: data.email, password: data.password })
      .expect(200);
    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body.professional.email).toBe(data.email);

    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/auth/me').expect(401);
  });

  it('answers 401 with the same message for unknown email and wrong password', async () => {
    const data = TestApp.professional();
    await t.agent().post('/api/auth/register').send(data).expect(201);

    const wrongPassword = await t
      .agent()
      .post('/api/auth/login')
      .send({ email: data.email, password: 'Wrong1234' });
    const unknownEmail = await t
      .agent()
      .post('/api/auth/login')
      .send({ email: 'nobody@mentora.test', password: 'Wrong1234' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message);
  });

  it('protected routes require a session', async () => {
    const response = await t.agent().get('/api/patients');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('after the trial ends: login works, /me says expired, protected routes answer 403', async () => {
    const data = TestApp.professional();
    await t.agent().post('/api/auth/register').send(data).expect(201);
    t.clock.advanceDays(15);

    try {
      const agent = t.agent();
      const login = await agent
        .post('/api/auth/login')
        .send({ email: data.email, password: data.password })
        .expect(200);
      expect(login.body.subscription.status).toBe('expired');

      const blocked = await agent.get('/api/patients');
      expect(blocked.status).toBe(403);
      expect(blocked.body.error.code).toBe('SUBSCRIPTION_INACTIVE');
      await agent.get('/api/auth/me').expect(200);
    } finally {
      t.clock.advanceDays(-15);
    }
  });
});
