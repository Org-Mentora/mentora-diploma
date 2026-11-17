import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { EarningsQueryDto, EarningsReportDto } from '../contracts/appointments.contracts';
import type { EarningsService } from '../model/EarningsService';

export interface GetEarningsReportInput extends EarningsQueryDto {
  actor: AuthenticatedActor;
}

// Presenter
export class GetEarningsReportPresenter extends Presenter<
  GetEarningsReportInput,
  EarningsReportDto
> {
  constructor(
    view: View<EarningsReportDto>,
    private readonly earnings: EarningsService,
  ) {
    super(view);
  }

  protected execute({ actor, from, to }: GetEarningsReportInput): Promise<EarningsReportDto> {
    return this.earnings.report(actor.professionalId, from, to);
  }
}
