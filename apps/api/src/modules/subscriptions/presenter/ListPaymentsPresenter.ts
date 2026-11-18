import { CursorCodec, type PageInput } from '#core/presenter/CursorCodec';
import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { PaymentPageDto } from '../contracts/subscriptions.contracts';
import type { SubscriptionService } from '../model/SubscriptionService';
import { SubscriptionViewModel } from './SubscriptionViewModel';

export interface ListPaymentsInput extends PageInput {
  actor: AuthenticatedActor;
}

// Presenter
export class ListPaymentsPresenter extends Presenter<ListPaymentsInput, PaymentPageDto> {
  constructor(
    view: View<PaymentPageDto>,
    private readonly service: SubscriptionService,
  ) {
    super(view);
  }

  protected async execute(input: ListPaymentsInput): Promise<PaymentPageDto> {
    const page = await this.service.listPayments(
      input.actor.professionalId,
      CursorCodec.request(input),
    );
    return CursorCodec.toDto(page, SubscriptionViewModel.payment);
  }
}
