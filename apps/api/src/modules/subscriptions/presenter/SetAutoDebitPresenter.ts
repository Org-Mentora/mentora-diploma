import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type {
  AutoDebitRequestDto,
  SubscriptionDetailDto,
} from '../contracts/subscriptions.contracts';
import type { SubscriptionService } from '../model/SubscriptionService';
import { SubscriptionViewModel } from './SubscriptionViewModel';

export type SetAutoDebitInput = { actor: AuthenticatedActor; data: AutoDebitRequestDto };

// Presenter
export class SetAutoDebitPresenter extends Presenter<
  SetAutoDebitInput,
  SubscriptionDetailDto,
  SubscriptionService
> {
  protected async execute({ actor, data }: SetAutoDebitInput): Promise<SubscriptionDetailDto> {
    return SubscriptionViewModel.toDto(
      await this.model.setAutoDebit(actor.professionalId, data.enabled),
      this.model,
    );
  }
}
