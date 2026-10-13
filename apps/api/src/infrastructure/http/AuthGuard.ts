import type { RequestHandler, Response } from 'express';
import { SubscriptionInactiveError, UnauthorizedError } from '#core/errors/ApplicationError';
import type { Clock } from '#core/model/Clock';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { TokenService } from '#core/security/TokenService';
import { SESSION_COOKIE_NAME } from './SessionCookie';

/**
 * Express middleware that turns the session cookie into an `AuthenticatedActor` stored in
 * `res.locals.actor` (ADR-0018). Errors are thrown and rendered by `HttpErrorHandler`.
 */
export class AuthGuard {
  constructor(
    private readonly tokens: TokenService,
    private readonly clock: Clock,
  ) {}

  /** Requires a valid session, whatever the subscription status (e.g. `/auth/me`). */
  readonly requireSession: RequestHandler = async (req, res, next) => {
    await this.authenticate(req.cookies?.[SESSION_COOKIE_NAME], res);
    next();
  };

  /** Requires a valid session and an active subscription or trial (CU-01 step 7). */
  readonly requireActiveSubscription: RequestHandler = async (req, res, next) => {
    const accessEndsAt = await this.authenticate(req.cookies?.[SESSION_COOKIE_NAME], res);
    if (accessEndsAt && accessEndsAt.getTime() <= this.clock.now().getTime()) {
      throw new SubscriptionInactiveError();
    }
    next();
  };

  private async authenticate(token: unknown, res: Response): Promise<Date | null> {
    if (typeof token !== 'string' || token.length === 0) {
      throw new UnauthorizedError();
    }
    const claims = await this.tokens.verify(token);
    if (!claims) {
      throw new UnauthorizedError('Your session is invalid or has expired');
    }
    const actor: AuthenticatedActor = { professionalId: claims.professionalId };
    res.locals.actor = actor;
    return claims.accessEndsAt;
  }
}
