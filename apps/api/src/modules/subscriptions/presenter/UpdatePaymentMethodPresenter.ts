import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type {
  SubscriptionDetailDto,
  UpdatePaymentMethodRequestDto,
} from '../contracts/subscriptions.contracts';
import type { SubscriptionService } from '../model/SubscriptionService';
import { SubscriptionViewModel } from './SubscriptionViewModel';

export type UpdatePaymentMethodInput = {
  actor: AuthenticatedActor;
  methodId: string;
  data: UpdatePaymentMethodRequestDto;
};

// Presenter
export class UpdatePaymentMethodPresenter extends Presenter<
  UpdatePaymentMethodInput,
  SubscriptionDetailDto
> {
  constructor(
    view: View<SubscriptionDetailDto>,
    private readonly service: SubscriptionService,
  ) {
    super(view);
  }

  protected async execute({
    actor,
    methodId,
    data,
  }: UpdatePaymentMethodInput): Promise<SubscriptionDetailDto> {
    return SubscriptionViewModel.toDto(
      await this.service.updatePaymentMethod(actor.professionalId, methodId, {
        ...(data.holderName !== undefined ? { holderName: data.holderName } : {}),
        ...(data.expMonth !== undefined ? { expMonth: data.expMonth } : {}),
        ...(data.expYear !== undefined ? { expYear: data.expYear } : {}),
        ...(data.makeDefault !== undefined ? { makeDefault: data.makeDefault } : {}),
      }),
      this.service,
    );
  }
}
