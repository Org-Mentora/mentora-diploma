import type { Response } from 'express';
import { UnauthorizedError } from '#core/errors/ApplicationError';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';

/** Reads the actor stored by `AuthGuard`. Views use it to build presenter input. */
export class ActorReader {
  static from(res: Response): AuthenticatedActor {
    const actor = res.locals.actor as AuthenticatedActor | undefined;
    if (!actor) {
      throw new UnauthorizedError();
    }
    return actor;
  }
}
