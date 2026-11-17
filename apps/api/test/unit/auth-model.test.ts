import { describe, expect, it } from 'vitest';
import { JoseTokenService } from '#infrastructure/security/JoseTokenService';
import { ScryptPasswordHasher } from '#infrastructure/security/ScryptPasswordHasher';
import { PasswordPolicy } from '../../src/modules/auth/model/PasswordPolicy';
import { PasswordRecovery } from '../../src/modules/auth/model/PasswordRecovery';
import { Professional } from '../../src/modules/auth/model/Professional';
import { ProfessionalLogo } from '../../src/modules/auth/model/ProfessionalLogo';

const now = new Date('2030-01-01T00:00:00.000Z');
const days = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);
const minutes = (n: number) => new Date(now.getTime() + n * 60 * 1000);

const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

describe('Professional (CU-03, CU-16, CU-17)', () => {
  const data = {
    firstName: ' Ana ',
    lastName: 'García',
    email: ' ANA@Mentora.test ',
    phone: '+54 11 5555 0000',
    specialty: 'Psychiatry',
    licenseNumber: 'mn-123',
    offices: ['Av. Corrientes 1234', ' ', 'Av. Corrientes 1234', 'Belgrano 55'],
    passwordHash: 'hash',
  };

  it('normalizes the profile and removes empty or repeated offices', () => {
    const professional = Professional.register(data, now);

    expect(professional.email).toBe('ana@mentora.test');
    expect(professional.licenseNumber).toBe('MN-123');
    expect(professional.firstName).toBe('Ana');
    expect(professional.offices).toEqual(['Av. Corrientes 1234', 'Belgrano 55']);
    expect(professional.hasLogo).toBe(false);
  });

  it('rejects a profile without required fields or with too many offices', () => {
    expect(() => Professional.register({ ...data, specialty: ' ' }, now)).toThrow(/specialty/);
    expect(() =>
      Professional.register({ ...data, offices: ['a', 'b', 'c', 'd', 'e', 'f'] }, now),
    ).toThrow(/up to 5 offices/);
  });

  it('updates the profile and records password and logo changes', () => {
    const professional = Professional.register(data, now);
    professional.updateProfile({ ...data, specialty: 'Child psychiatry' }, days(1));
    professional.changePasswordHash('new-hash', days(2));
    professional.markLogo(days(3), days(3));

    expect(professional.specialty).toBe('Child psychiatry');
    expect(professional.passwordHash).toBe('new-hash');
    expect(professional.passwordChangedAt).toEqual(days(2));
    expect(professional.hasLogo).toBe(true);
  });
});

describe('ProfessionalLogo (CU-16 step 5)', () => {
  it('accepts PNG and JPEG data URLs and round-trips them', () => {
    const logo = ProfessionalLogo.fromDataUrl(PNG);
    expect(logo.mimeType).toBe('image/png');
    expect(logo.toDataUrl()).toBe(PNG);
  });

  it('rejects other formats, renamed files and big images', () => {
    expect(() => ProfessionalLogo.fromDataUrl('data:image/gif;base64,R0lGODlh')).toThrow(
      /Unsupported logo format/,
    );
    expect(() => ProfessionalLogo.fromDataUrl(PNG.replace('image/png', 'image/jpeg'))).toThrow(
      /Unsupported/,
    );
    const big = `data:image/png;base64,iVBORw0KGgo${'A'.repeat(800_000)}`;
    expect(() => ProfessionalLogo.fromDataUrl(big)).toThrow(/too large/);
  });
});

describe('PasswordRecovery (CU-02)', () => {
  it('can be used until it expires, is used or runs out of attempts', () => {
    const recovery = PasswordRecovery.issue('p-1', 'hash', now);
    expect(recovery.isUsableAt(minutes(14))).toBe(true);
    expect(recovery.isUsableAt(minutes(15))).toBe(false);

    for (let i = 0; i < PasswordRecovery.MAX_ATTEMPTS; i += 1) {
      recovery.recordFailedAttempt();
    }
    expect(recovery.isUsableAt(now)).toBe(false);

    const used = PasswordRecovery.issue('p-1', 'hash', now);
    used.invalidate(minutes(1));
    expect(used.isUsableAt(minutes(2))).toBe(false);
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

  it('blames the requested form field', () => {
    try {
      PasswordPolicy.assertSatisfiedBy('weak', 'newPassword');
      expect.unreachable();
    } catch (error) {
      expect((error as { details: { field: string } }).details.field).toBe('newPassword');
    }
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
    const claims = { professionalId: 'p-1', accessEndsAt: days(14), credentialsVersion: 7 };
    const token = await tokens.issue(claims);

    expect(await tokens.verify(token)).toEqual(claims);
    expect(await tokens.verify(`${token}x`)).toBeNull();
    expect(await new JoseTokenService('y'.repeat(40), 60).verify(token)).toBeNull();
  });
});
