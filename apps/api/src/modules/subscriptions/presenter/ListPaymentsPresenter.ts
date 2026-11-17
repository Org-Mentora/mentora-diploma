import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { PaymentDto } from '../contracts/subscriptions.contracts';
import type { SubscriptionService } from '../model/SubscriptionService';
import { SubscriptionViewModel } from './SubscriptionViewModel';

// Presenter
export class ListPaymentsPresenter extends Presenter<AuthenticatedActor, PaymentDto[]> {
  constructor(
    view: View<PaymentDto[]>,
    private readonly service: SubscriptionService,
  ) {
    super(view);
  }

  protected async execute(actor: AuthenticatedActor): Promise<PaymentDto[]> {
    const payments = await this.service.listPayments(actor.professionalId);
    return payments.map(SubscriptionViewModel.payment);
  }
}
