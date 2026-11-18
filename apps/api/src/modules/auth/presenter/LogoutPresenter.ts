import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { AuthService } from '../model/AuthService';

// Presenter
export class LogoutPresenter extends Presenter<AuthenticatedActor | null, void, AuthService> {
  protected async execute(actor: AuthenticatedActor | null): Promise<void> {
    if (actor) {
      await this.model.logout(actor.professionalId);
    }
  }
}
