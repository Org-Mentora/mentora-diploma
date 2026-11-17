import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { AuthService } from '../model/AuthService';

// Presenter
export class LogoutPresenter extends Presenter<AuthenticatedActor | null, void> {
  constructor(
    view: View<void>,
    private readonly auth: AuthService,
  ) {
    super(view);
  }

  protected async execute(actor: AuthenticatedActor | null): Promise<void> {
    if (actor) {
      await this.auth.logout(actor.professionalId);
    }
  }
}
