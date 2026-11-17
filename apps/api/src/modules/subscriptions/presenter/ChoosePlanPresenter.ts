import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type {
  ChoosePlanRequestDto,
  SubscriptionDetailDto,
} from '../contracts/subscriptions.contracts';
import type { SubscriptionService } from '../model/SubscriptionService';
import { SubscriptionViewModel } from './SubscriptionViewModel';

export type ChoosePlanInput = { actor: AuthenticatedActor; data: ChoosePlanRequestDto };

// Presenter
export class ChoosePlanPresenter extends Presenter<ChoosePlanInput, SubscriptionDetailDto> {
  constructor(
    view: View<SubscriptionDetailDto>,
    private readonly service: SubscriptionService,
  ) {
    super(view);
  }

  protected async execute({ actor, data }: ChoosePlanInput): Promise<SubscriptionDetailDto> {
    return SubscriptionViewModel.toDto(
      await this.service.choosePlan(actor.professionalId, data.planId),
      this.service,
    );
  }
}
