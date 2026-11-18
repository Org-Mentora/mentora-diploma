import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { EarningsQueryDto, EarningsReportDto } from '../contracts/appointments.contracts';
import type { EarningsService } from '../model/EarningsService';

export interface GetEarningsReportInput extends EarningsQueryDto {
  actor: AuthenticatedActor;
}

// Presenter
export class GetEarningsReportPresenter extends Presenter<
  GetEarningsReportInput,
  EarningsReportDto,
  EarningsService
> {
  protected execute({ actor, from, to }: GetEarningsReportInput): Promise<EarningsReportDto> {
    return this.model.report(actor.professionalId, from, to);
  }
}
