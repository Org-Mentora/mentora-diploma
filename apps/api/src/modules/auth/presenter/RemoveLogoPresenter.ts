import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { ProfileService } from '../model/ProfileService';

export type RemoveLogoInput = AuthenticatedActor;

// Presenter
export class RemoveLogoPresenter extends Presenter<RemoveLogoInput, void, ProfileService> {
  protected async execute(input: RemoveLogoInput): Promise<void> {
    await this.model.removeLogo(input.professionalId);
  }
}
