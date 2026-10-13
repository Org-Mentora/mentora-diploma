import { describe, expect, it } from 'vitest';
import { JoseTokenService } from '#infrastructure/security/JoseTokenService';
import { ScryptPasswordHasher } from '#infrastructure/security/ScryptPasswordHasher';
import { PasswordPolicy } from '../../src/modules/auth/model/PasswordPolicy';
import { Subscription } from '../../src/modules/auth/model/Subscription';

const now = new Date('2030-01-01T00:00:00.000Z');
const days = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

describe('Subscription (CU-03 trial, CU-01 step 7)', () => {
  it('starts a trial that grants access until it ends', () => {
    const trial = Subscription.startTrial(now, 14);

    expect(trial.statusAt(now)).toBe('trial');
    expect(trial.daysLeftAt(now)).toBe(14);
    expect(trial.allowsAccessAt(days(13))).toBe(true);
    expect(trial.statusAt(days(14))).toBe('expired');
    expect(trial.allowsAccessAt(days(15))).toBe(false);
  });

  it('a paid plan without end date stays active', () => {
    expect(Subscription.restore('paid', null).statusAt(days(1000))).toBe('active');
  });
});

describe('PasswordPolicy', () => {
  it.each([
    ['short1', ['at least 8 characters']],
    ['onlyletters', ['at least one number']],
    ['12345678', ['at least one letter']],
    ['Secret123', []],
  ])('%s → %j', (password, unmet) => {
    expect(PasswordPolicy.unmetCriteria(password)).toEqual(unmet);
  });
});

describe('Security adapters', () => {
  it('ScryptPasswordHasher verifies the original password only', async () => {
    const hasher = new ScryptPasswordHasher();
    const hash = await hasher.hash('Secret123');

    expect(hash).toMatch(/^scrypt\$/);
    expect(await hasher.verify('Secret123', hash)).toBe(true);
    expect(await hasher.verify('Secret124', hash)).toBe(false);
    expect(await hasher.verify('Secret123', 'garbage')).toBe(false);
  });

  it('JoseTokenService round-trips claims and rejects tampered tokens', async () => {
    const tokens = new JoseTokenService('x'.repeat(40), 60);
    const token = await tokens.issue({ professionalId: 'p-1', accessEndsAt: days(14) });

    expect(await tokens.verify(token)).toEqual({ professionalId: 'p-1', accessEndsAt: days(14) });
    expect(await tokens.verify(`${token}x`)).toBeNull();
    expect(await new JoseTokenService('y'.repeat(40), 60).verify(token)).toBeNull();
  });
});
