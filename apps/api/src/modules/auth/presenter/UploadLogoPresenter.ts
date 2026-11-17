import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { UploadLogoRequestDto } from '../contracts/auth.contracts';
import type { ProfileService } from '../model/ProfileService';

export type UploadLogoInput = { actor: AuthenticatedActor; data: UploadLogoRequestDto };

// Presenter
export class UploadLogoPresenter extends Presenter<UploadLogoInput, void> {
  constructor(
    view: View<void>,
    private readonly profiles: ProfileService,
  ) {
    super(view);
  }

  protected async execute(input: UploadLogoInput): Promise<void> {
    await this.profiles.uploadLogo(input.actor.professionalId, input.data.dataUrl);
  }
}
