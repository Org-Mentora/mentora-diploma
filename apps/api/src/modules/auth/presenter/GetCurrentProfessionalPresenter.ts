import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { SessionDto } from '../contracts/auth.contracts';
import type { AuthService } from '../model/AuthService';
import { SessionViewModel } from './SessionViewModel';

/** Returns the current session so the SPA can restore it after a reload. */
export class GetCurrentProfessionalPresenter extends Presenter<AuthenticatedActor, SessionDto> {
  constructor(
    view: View<SessionDto>,
    private readonly auth: AuthService,
  ) {
    super(view);
  }

  protected async execute(actor: AuthenticatedActor): Promise<SessionDto> {
    const professional = await this.auth.getProfile(actor.professionalId);
    return SessionViewModel.from(professional, this.auth.now);
  }
}
