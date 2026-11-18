import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { AuthService } from '../model/AuthService';
import { type SessionResult, SessionViewModel } from './SessionViewModel';

// Presenter
export class GetCurrentProfessionalPresenter extends Presenter<
  AuthenticatedActor,
  SessionResult,
  AuthService
> {
  protected async execute(actor: AuthenticatedActor): Promise<SessionResult> {
    const subject = await this.model.getSession(actor.professionalId, actor.credentialsVersion);
    return {
      token: await this.model.issueSessionToken(subject),
      session: SessionViewModel.from(subject),
    };
  }
}
