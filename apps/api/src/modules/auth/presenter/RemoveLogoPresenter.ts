import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { ProfileService } from '../model/ProfileService';

export type RemoveLogoInput = AuthenticatedActor;

// Presenter
export class RemoveLogoPresenter extends Presenter<RemoveLogoInput, void> {
  constructor(
    view: View<void>,
    private readonly profiles: ProfileService,
  ) {
    super(view);
  }

  protected async execute(input: RemoveLogoInput): Promise<void> {
    await this.profiles.removeLogo(input.professionalId);
  }
}
