import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
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
  ConsultationFeesDto
> {
  constructor(
    view: View<ConsultationFeesDto>,
    private readonly earnings: EarningsService,
  ) {
    super(view);
  }

  protected async execute({
    actor,
    data,
  }: UpdateConsultationFeesInput): Promise<ConsultationFeesDto> {
    return FeesViewModel.toDto(await this.earnings.updateFees(actor.professionalId, data.amounts));
  }
}
