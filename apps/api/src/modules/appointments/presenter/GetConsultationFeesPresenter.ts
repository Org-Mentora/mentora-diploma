import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { ConsultationFeesDto } from '../contracts/appointments.contracts';
import type { EarningsService } from '../model/EarningsService';
import { FeesViewModel } from './FeesViewModel';

// Presenter
export class GetConsultationFeesPresenter extends Presenter<
  AuthenticatedActor,
  ConsultationFeesDto,
  EarningsService
> {
  protected async execute(actor: AuthenticatedActor): Promise<ConsultationFeesDto> {
    return FeesViewModel.toDto(await this.model.getFees(actor.professionalId));
  }
}
