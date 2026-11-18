import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { UploadLogoRequestDto } from '../contracts/auth.contracts';
import type { ProfileService } from '../model/ProfileService';

export type UploadLogoInput = { actor: AuthenticatedActor; data: UploadLogoRequestDto };

// Presenter
export class UploadLogoPresenter extends Presenter<UploadLogoInput, void, ProfileService> {
  protected async execute(input: UploadLogoInput): Promise<void> {
    await this.model.uploadLogo(input.actor.professionalId, input.data.dataUrl);
  }
}
