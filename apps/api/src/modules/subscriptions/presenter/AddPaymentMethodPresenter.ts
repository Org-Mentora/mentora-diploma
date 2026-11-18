import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type {
  AddPaymentMethodRequestDto,
  SubscriptionDetailDto,
} from '../contracts/subscriptions.contracts';
import type { SubscriptionService } from '../model/SubscriptionService';
import { SubscriptionViewModel } from './SubscriptionViewModel';

export type AddPaymentMethodInput = { actor: AuthenticatedActor; data: AddPaymentMethodRequestDto };

// Presenter
export class AddPaymentMethodPresenter extends Presenter<
  AddPaymentMethodInput,
  SubscriptionDetailDto,
  SubscriptionService
> {
  protected async execute({ actor, data }: AddPaymentMethodInput): Promise<SubscriptionDetailDto> {
    return SubscriptionViewModel.toDto(
      await this.model.addPaymentMethod(
        actor.professionalId,
        {
          number: data.cardNumber,
          expMonth: data.expMonth,
          expYear: data.expYear,
          cvc: data.cvc,
          holderName: data.holderName,
        },
        data.makeDefault ?? false,
      ),
      this.model,
    );
  }
}
