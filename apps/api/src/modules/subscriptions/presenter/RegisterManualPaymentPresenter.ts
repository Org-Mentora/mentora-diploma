import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { ManualPaymentRequestDto, PaymentDto } from '../contracts/subscriptions.contracts';
import type { SubscriptionService } from '../model/SubscriptionService';
import { SubscriptionViewModel } from './SubscriptionViewModel';

export interface RegisterManualPaymentInput {
  actor: AuthenticatedActor;
  data: ManualPaymentRequestDto;
}

// Presenter
export class RegisterManualPaymentPresenter extends Presenter<
  RegisterManualPaymentInput,
  PaymentDto
> {
  constructor(
    view: View<PaymentDto>,
    private readonly service: SubscriptionService,
  ) {
    super(view);
  }

  protected async execute({ actor, data }: RegisterManualPaymentInput): Promise<PaymentDto> {
    const payment = await this.service.registerManualPayment(actor.professionalId, {
      amount: data.amount,
      paidAt: new Date(`${data.paidAt}T12:00:00.000Z`),
      method: data.method,
      reference: data.reference ?? null,
    });
    return SubscriptionViewModel.payment(payment);
  }
}
