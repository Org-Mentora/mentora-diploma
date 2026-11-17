import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { AuthService } from '../model/AuthService';
import { type SessionResult, SessionViewModel } from './SessionViewModel';

// Presenter
export class GetCurrentProfessionalPresenter extends Presenter<AuthenticatedActor, SessionResult> {
  constructor(
    view: View<SessionResult>,
    private readonly auth: AuthService,
  ) {
    super(view);
  }

  protected async execute(actor: AuthenticatedActor): Promise<SessionResult> {
    const subject = await this.auth.getSession(actor.professionalId, actor.credentialsVersion);
    return {
      token: await this.auth.issueSessionToken(subject),
      session: SessionViewModel.from(subject),
    };
  }
}
