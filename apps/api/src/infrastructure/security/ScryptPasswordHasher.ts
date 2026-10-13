import { randomBytes, type ScryptOptions, scrypt, timingSafeEqual } from 'node:crypto';
import { PasswordHasher } from '#core/security/PasswordHasher';

const KEY_LENGTH = 64;
const OPTIONS: ScryptOptions = { N: 16_384, r: 8, p: 1 };

function derive(plain: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(plain, salt, KEY_LENGTH, OPTIONS, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

/**
 * Adapter (ADR-0007): `PasswordHasher` on top of Node's built-in scrypt, so no native
 * dependency is needed. Stored format: `scrypt$<salt base64>$<hash base64>`.
 */
export class ScryptPasswordHasher extends PasswordHasher {
  async hash(plain: string): Promise<string> {
    const salt = randomBytes(16);
    const key = await derive(plain, salt);
    return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
  }

  async verify(plain: string, stored: string): Promise<boolean> {
    const [algorithm, salt, hash] = stored.split('$');
    if (algorithm !== 'scrypt' || !salt || !hash) {
      return false;
    }
    const expected = Buffer.from(hash, 'base64');
    const actual = await derive(plain, Buffer.from(salt, 'base64'));
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}
