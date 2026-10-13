import { jwtVerify, SignJWT } from 'jose';
import { type SessionClaims, TokenService } from '#core/security/TokenService';

const ISSUER = 'mentora-api';

/** Adapter (ADR-0007): signs and verifies HS256 JWTs with `jose` (ADR-0018). */
export class JoseTokenService extends TokenService {
  readonly #key: Uint8Array;

  constructor(
    secret: string,
    readonly ttlSeconds: number,
  ) {
    super();
    this.#key = new TextEncoder().encode(secret);
  }

  issue(claims: SessionClaims): Promise<string> {
    return new SignJWT({ aex: claims.accessEndsAt?.getTime() ?? null })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(claims.professionalId)
      .setIssuer(ISSUER)
      .setIssuedAt()
      .setExpirationTime(`${this.ttlSeconds}s`)
      .sign(this.#key);
  }

  async verify(token: string): Promise<SessionClaims | null> {
    try {
      const { payload } = await jwtVerify(token, this.#key, { issuer: ISSUER });
      if (!payload.sub) {
        return null;
      }
      const accessEndsAt = typeof payload.aex === 'number' ? new Date(payload.aex) : null;
      return { professionalId: payload.sub, accessEndsAt };
    } catch {
      return null;
    }
  }
}
