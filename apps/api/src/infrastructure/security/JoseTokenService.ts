import { jwtVerify, SignJWT } from 'jose';
import { type SessionClaims, TokenService } from '#core/security/TokenService';

const ISSUER = 'mentora-api';
const ALGORITHM = 'HS256';

// Adapter
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
    return new SignJWT({
      aex: claims.accessEndsAt?.getTime() ?? null,
      cv: claims.credentialsVersion,
    })
      .setProtectedHeader({ alg: ALGORITHM })
      .setSubject(claims.professionalId)
      .setIssuer(ISSUER)
      .setIssuedAt()
      .setExpirationTime(`${this.ttlSeconds}s`)
      .sign(this.#key);
  }

  async verify(token: string): Promise<SessionClaims | null> {
    try {
      const { payload } = await jwtVerify(token, this.#key, {
        issuer: ISSUER,
        algorithms: [ALGORITHM],
      });
      if (!payload.sub) {
        return null;
      }
      const accessEndsAt = typeof payload.aex === 'number' ? new Date(payload.aex) : null;
      const credentialsVersion = typeof payload.cv === 'number' ? payload.cv : 0;
      return { professionalId: payload.sub, accessEndsAt, credentialsVersion };
    } catch {
      return null;
    }
  }
}
