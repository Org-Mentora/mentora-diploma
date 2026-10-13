/** What a session token proves about its bearer. */
export interface SessionClaims {
  professionalId: string;
  /** When the professional loses access (end of trial); `null` means no expiry. */
  accessEndsAt: Date | null;
}

/** Issues and verifies session tokens. Implemented by `JoseTokenService` (ADR-0018). */
export abstract class TokenService {
  abstract readonly ttlSeconds: number;
  abstract issue(claims: SessionClaims): Promise<string>;
  /** Returns `null` for any invalid, tampered or expired token. */
  abstract verify(token: string): Promise<SessionClaims | null>;
}
