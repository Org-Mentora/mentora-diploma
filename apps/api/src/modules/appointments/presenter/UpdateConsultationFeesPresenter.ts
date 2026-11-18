import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type {
  ConsultationFeesDto,
  UpdateConsultationFeesRequestDto,
} from '../contracts/appointments.contracts';
import type { EarningsService } from '../model/EarningsService';
import { FeesViewModel } from './FeesViewModel';

export interface UpdateConsultationFeesInput {
  actor: AuthenticatedActor;
  data: UpdateConsultationFeesRequestDto;
}

// Presenter
export class UpdateConsultationFeesPresenter extends Presenter<
  UpdateConsultationFeesInput,
  ConsultationFeesDto,
  EarningsService
> {
  protected async execute({
    actor,
    data,
  }: UpdateConsultationFeesInput): Promise<ConsultationFeesDto> {
    return FeesViewModel.toDto(await this.model.updateFees(actor.professionalId, data.amounts));
  }
}
