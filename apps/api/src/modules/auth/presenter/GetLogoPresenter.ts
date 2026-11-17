import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { LogoDto } from '../contracts/auth.contracts';
import type { ProfileService } from '../model/ProfileService';

// Presenter
export class GetLogoPresenter extends Presenter<AuthenticatedActor, LogoDto> {
  constructor(
    view: View<LogoDto>,
    private readonly profiles: ProfileService,
  ) {
    super(view);
  }

  protected async execute(actor: AuthenticatedActor): Promise<LogoDto> {
    const logo = await this.profiles.getLogo(actor.professionalId);
    return { dataUrl: logo?.toDataUrl() ?? null };
  }
}
