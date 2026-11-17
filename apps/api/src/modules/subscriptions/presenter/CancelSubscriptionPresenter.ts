import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { SubscriptionDetailDto } from '../contracts/subscriptions.contracts';
import type { SubscriptionService } from '../model/SubscriptionService';
import { SubscriptionViewModel } from './SubscriptionViewModel';

export type CancelSubscriptionInput = AuthenticatedActor;

// Presenter
export class CancelSubscriptionPresenter extends Presenter<
  CancelSubscriptionInput,
  SubscriptionDetailDto
> {
  constructor(
    view: View<SubscriptionDetailDto>,
    private readonly service: SubscriptionService,
  ) {
    super(view);
  }

  protected async execute(actor: CancelSubscriptionInput): Promise<SubscriptionDetailDto> {
    return SubscriptionViewModel.toDto(
      await this.service.cancel(actor.professionalId),
      this.service,
    );
  }
}
