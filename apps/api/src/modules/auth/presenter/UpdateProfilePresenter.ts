import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { SessionDto, UpdateProfileRequestDto } from '../contracts/auth.contracts';
import type { ProfileService } from '../model/ProfileService';
import { SessionViewModel } from './SessionViewModel';

export interface UpdateProfileInput {
  actor: AuthenticatedActor;
  data: UpdateProfileRequestDto;
}

// Presenter
export class UpdateProfilePresenter extends Presenter<
  UpdateProfileInput,
  SessionDto,
  ProfileService
> {
  protected async execute({ actor, data }: UpdateProfileInput): Promise<SessionDto> {
    return SessionViewModel.from(await this.model.updateProfile(actor.professionalId, data));
  }
}
