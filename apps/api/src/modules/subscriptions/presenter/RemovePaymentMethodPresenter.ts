import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { SubscriptionDetailDto } from '../contracts/subscriptions.contracts';
import type { SubscriptionService } from '../model/SubscriptionService';
import { SubscriptionViewModel } from './SubscriptionViewModel';

export type RemovePaymentMethodInput = {
  actor: AuthenticatedActor;
  methodId: string;
  confirmed: boolean;
};

// Presenter
export class RemovePaymentMethodPresenter extends Presenter<
  RemovePaymentMethodInput,
  SubscriptionDetailDto,
  SubscriptionService
> {
  protected async execute({
    actor,
    methodId,
    confirmed,
  }: RemovePaymentMethodInput): Promise<SubscriptionDetailDto> {
    return SubscriptionViewModel.toDto(
      await this.model.removePaymentMethod(actor.professionalId, methodId, confirmed),
      this.model,
    );
  }
}
