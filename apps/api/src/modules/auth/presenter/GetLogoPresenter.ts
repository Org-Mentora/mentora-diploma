import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { LogoDto } from '../contracts/auth.contracts';
import type { ProfileService } from '../model/ProfileService';

// Presenter
export class GetLogoPresenter extends Presenter<AuthenticatedActor, LogoDto, ProfileService> {
  protected async execute(actor: AuthenticatedActor): Promise<LogoDto> {
    const logo = await this.model.getLogo(actor.professionalId);
    return { dataUrl: logo?.toDataUrl() ?? null };
  }
}
