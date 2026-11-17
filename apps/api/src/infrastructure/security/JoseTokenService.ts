import { jwtVerify, SignJWT } from 'jose';
import { type SessionClaims, TokenService } from '#core/security/TokenService';
import type { TokenSigningAlgorithm } from './TokenSigningAlgorithm';

const ISSUER = 'mentora-api';

// Adapter
export class JoseTokenService extends TokenService {
  constructor(
    private readonly algorithm: TokenSigningAlgorithm,
    private readonly ttlSeconds: number,
  ) {
    super();
  }

  issue(claims: SessionClaims): Promise<string> {
    return new SignJWT({
      aex: claims.accessEndsAt?.getTime() ?? null,
      cv: claims.credentialsVersion,
    })
      .setProtectedHeader({ alg: this.algorithm.name })
      .setSubject(claims.professionalId)
      .setIssuer(ISSUER)
      .setIssuedAt()
      .setExpirationTime(`${this.ttlSeconds}s`)
      .sign(this.algorithm.signingKey);
  }

  async verify(token: string): Promise<SessionClaims | null> {
    try {
      const { payload } = await jwtVerify(token, this.algorithm.verificationKey, {
        issuer: ISSUER,
        algorithms: [this.algorithm.name],
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
