import type { Response } from 'express';
import { UnauthorizedError } from '#core/errors/ApplicationError';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';

export class ActorReader {
  static from(res: Response): AuthenticatedActor {
    const actor = res.locals.actor as AuthenticatedActor | undefined;
    if (!actor) {
      throw new UnauthorizedError();
    }
    return actor;
  }

  static optional(res: Response): AuthenticatedActor | null {
    return (res.locals.actor as AuthenticatedActor | undefined) ?? null;
  }
}
