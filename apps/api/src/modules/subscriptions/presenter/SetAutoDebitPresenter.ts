import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type {
  AutoDebitRequestDto,
  SubscriptionDetailDto,
} from '../contracts/subscriptions.contracts';
import type { SubscriptionService } from '../model/SubscriptionService';
import { SubscriptionViewModel } from './SubscriptionViewModel';

export type SetAutoDebitInput = { actor: AuthenticatedActor; data: AutoDebitRequestDto };

// Presenter
export class SetAutoDebitPresenter extends Presenter<SetAutoDebitInput, SubscriptionDetailDto> {
  constructor(
    view: View<SubscriptionDetailDto>,
    private readonly service: SubscriptionService,
  ) {
    super(view);
  }

  protected async execute({ actor, data }: SetAutoDebitInput): Promise<SubscriptionDetailDto> {
    return SubscriptionViewModel.toDto(
      await this.service.setAutoDebit(actor.professionalId, data.enabled),
      this.service,
    );
  }
}
