export interface SessionClaims {
  professionalId: string;
  accessEndsAt: Date | null;
  credentialsVersion: number;
}

export abstract class TokenService {
  abstract readonly ttlSeconds: number;
  abstract issue(claims: SessionClaims): Promise<string>;
  abstract verify(token: string): Promise<SessionClaims | null>;
}
