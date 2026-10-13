/** One-way password hashing. Implemented by `ScryptPasswordHasher` (ADR-0018). */
export abstract class PasswordHasher {
  abstract hash(plain: string): Promise<string>;
  abstract verify(plain: string, hash: string): Promise<boolean>;
}
