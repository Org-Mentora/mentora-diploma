import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { TestApp } from '../support/TestApp';

const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

describe('Account API (CU-02, CU-16, CU-17)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await TestApp.start();
  });

  afterAll(async () => {
    await t.stop();
  });

  afterEach(() => {
    t.clock.set(TestApp.START);
  });

  const registered = async () => {
    const data = TestApp.professional();
    const agent = t.agent();
    await agent.post('/api/auth/register').send(data).expect(201);
    return { data, agent };
  };

  describe('CU-02 Recover password', () => {
    it('answers the same for unknown emails and sends nothing', async () => {
      const before = t.mail.sent.length;
      const unknown = await t
        .agent()
        .post('/api/auth/password-recovery')
        .send({ email: 'nobody@mentora.test' });
      const { data } = await registered();
      const known = await t.agent().post('/api/auth/password-recovery').send({ email: data.email });

      expect(unknown.status).toBe(202);
      expect(known.status).toBe(202);
      expect(unknown.body).toEqual(known.body);
      expect(t.mail.sent.length).toBe(before + 1);
      expect(t.mail.lastTo(data.email)?.text).toContain('can be used only once');
    });

    it('verifies the code, resets the password and invalidates the code', async () => {
      const { data } = await registered();
      await t.agent().post('/api/auth/password-recovery').send({ email: data.email }).expect(202);
      const code = t.mail.recoveryCodeFor(data.email);
      const wrong = code === '000000' ? '111111' : '000000';

      const bad = await t
        .agent()
        .post('/api/auth/password-recovery/verify')
        .send({ email: data.email, code: wrong });
      expect(bad.status).toBe(400);
      expect(bad.body.error.code).toBe('INVALID_RECOVERY_CODE');
      await t
        .agent()
        .post('/api/auth/password-recovery/verify')
        .send({ email: data.email, code })
        .expect(204);

      const weak = await t
        .agent()
        .post('/api/auth/password-recovery/reset')
        .send({ email: data.email, code, newPassword: 'onlyletters' });
      expect(weak.status).toBe(400);
      expect(weak.body.error.details.field).toBe('newPassword');

      await t
        .agent()
        .post('/api/auth/password-recovery/reset')
        .send({ email: data.email, code, newPassword: 'Changed456' })
        .expect(204);

      await t
        .agent()
        .post('/api/auth/login')
        .send({ email: data.email, password: data.password })
        .expect(401);
      await t
        .agent()
        .post('/api/auth/login')
        .send({ email: data.email, password: 'Changed456' })
        .expect(200);
      const reused = await t
        .agent()
        .post('/api/auth/password-recovery/reset')
        .send({ email: data.email, code, newPassword: 'Another789' });
      expect(reused.status).toBe(400);
    });

    it('blocks the code after five wrong attempts, even with the right one', async () => {
      const { data } = await registered();
      await t.agent().post('/api/auth/password-recovery').send({ email: data.email }).expect(202);
      const code = t.mail.recoveryCodeFor(data.email);
      const wrong = code === '000000' ? '111111' : '000000';

      for (let i = 0; i < 5; i += 1) {
        await t
          .agent()
          .post('/api/auth/password-recovery/verify')
          .send({ email: data.email, code: wrong })
          .expect(400);
      }
      await t
        .agent()
        .post('/api/auth/password-recovery/verify')
        .send({ email: data.email, code })
        .expect(400);
    });

    it('expires codes after 15 minutes and replaces them with a new request', async () => {
      const { data } = await registered();
      await t.agent().post('/api/auth/password-recovery').send({ email: data.email }).expect(202);
      const first = t.mail.recoveryCodeFor(data.email);
      t.clock.advanceMinutes(16);
      await t
        .agent()
        .post('/api/auth/password-recovery/verify')
        .send({ email: data.email, code: first })
        .expect(400);

      await t.agent().post('/api/auth/password-recovery').send({ email: data.email }).expect(202);
      const second = t.mail.recoveryCodeFor(data.email);
      await t
        .agent()
        .post('/api/auth/password-recovery/verify')
        .send({ email: data.email, code: second })
        .expect(204);
    });
  });

  describe('CU-17 Change password', () => {
    it('requires the current password and keeps the session when it is wrong', async () => {
      const { data, agent } = await registered();
      const wrong = await agent
        .put('/api/auth/password')
        .send({ currentPassword: 'Wrong1234', newPassword: 'Changed456' });
      expect(wrong.status).toBe(400);
      expect(wrong.body.error.code).toBe('INVALID_CURRENT_PASSWORD');
      await agent.get('/api/auth/me').expect(200);

      const otherDevice = t.agent();
      await otherDevice
        .post('/api/auth/login')
        .send({ email: data.email, password: data.password })
        .expect(200);

      await agent
        .put('/api/auth/password')
        .send({ currentPassword: data.password, newPassword: 'Changed456' })
        .expect(200);
      await agent.get('/api/auth/me').expect(200);
      await otherDevice.get('/api/auth/me').expect(401);
      await t
        .agent()
        .post('/api/auth/login')
        .send({ email: data.email, password: 'Changed456' })
        .expect(200);
    });

    it('rejects a weak new password', async () => {
      const { data, agent } = await registered();
      const weak = await agent
        .put('/api/auth/password')
        .send({ currentPassword: data.password, newPassword: '12345678' });
      expect(weak.status).toBe(400);
      expect(weak.body.error.message).toContain('at least one letter');
    });
  });

  describe('CU-16 Manage professional data (and CU-03 optional fields)', () => {
    it('registers with offices and updates the profile', async () => {
      const agent = t.agent();
      const data = TestApp.professional({ offices: ['Av. Santa Fe 1000'] });
      const register = await agent.post('/api/auth/register').send(data).expect(201);
      expect(register.body.professional).toMatchObject({
        offices: ['Av. Santa Fe 1000'],
        hasLogo: false,
      });

      const updated = await agent.put('/api/auth/profile').send({
        firstName: 'Ana María',
        lastName: 'García',
        email: data.email,
        phone: '+54 11 4444 0000',
        specialty: 'Child psychiatry',
        licenseNumber: data.licenseNumber,
        offices: ['Av. Santa Fe 1000', 'Cabildo 2000'],
      });
      expect(updated.status).toBe(200);
      expect(updated.body.professional).toMatchObject({
        fullName: 'Ana María García',
        specialty: 'Child psychiatry',
        offices: ['Av. Santa Fe 1000', 'Cabildo 2000'],
      });
    });

    it("rejects another professional's email or license with 409", async () => {
      const { data: other } = await registered();
      const { data, agent } = await registered();
      const profile = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        specialty: data.specialty,
        licenseNumber: data.licenseNumber,
        offices: [],
      };

      const email = await agent.put('/api/auth/profile').send({ ...profile, email: other.email });
      const license = await agent
        .put('/api/auth/profile')
        .send({ ...profile, licenseNumber: other.licenseNumber });

      expect(email.status).toBe(409);
      expect(email.body.error.details.field).toBe('email');
      expect(license.status).toBe(409);
    });

    it('uploads, reads and removes the logo; rejects unsupported formats', async () => {
      const { agent } = await registered();
      await agent.get('/api/auth/logo').expect(200, { dataUrl: null });

      await agent.put('/api/auth/logo').send({ dataUrl: PNG }).expect(204);
      expect((await agent.get('/api/auth/logo')).body.dataUrl).toBe(PNG);
      expect((await agent.get('/api/auth/me')).body.professional.hasLogo).toBe(true);

      const gif = await agent.put('/api/auth/logo').send({ dataUrl: 'data:image/gif;base64,R0lG' });
      expect(gif.status).toBe(400);
      expect(gif.body.error.message).toContain('PNG or JPEG');

      await agent.delete('/api/auth/logo').expect(204);
      expect((await agent.get('/api/auth/me')).body.professional.hasLogo).toBe(false);
    });
  });
});
