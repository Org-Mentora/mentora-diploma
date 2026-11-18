import type { View } from '#core/view/View';
import type {
  PaymentDto,
  PaymentPageDto,
  SubscriptionDetailDto,
} from '../contracts/subscriptions.contracts';
import type { SubscriptionService } from '../model/SubscriptionService';
import { AddPaymentMethodPresenter } from './AddPaymentMethodPresenter';
import { CancelSubscriptionPresenter } from './CancelSubscriptionPresenter';
import { ChoosePlanPresenter } from './ChoosePlanPresenter';
import { GetSubscriptionPresenter } from './GetSubscriptionPresenter';
import { ListPaymentsPresenter } from './ListPaymentsPresenter';
import { RegisterManualPaymentPresenter } from './RegisterManualPaymentPresenter';
import { RemovePaymentMethodPresenter } from './RemovePaymentMethodPresenter';
import { SetAutoDebitPresenter } from './SetAutoDebitPresenter';
import { UpdatePaymentMethodPresenter } from './UpdatePaymentMethodPresenter';

// Abstract Factory
export class SubscriptionPresenters {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  getSubscription(view: View<SubscriptionDetailDto>) {
    return new GetSubscriptionPresenter(view, this.subscriptionService);
  }

  choosePlan(view: View<SubscriptionDetailDto>) {
    return new ChoosePlanPresenter(view, this.subscriptionService);
  }

  addPaymentMethod(view: View<SubscriptionDetailDto>) {
    return new AddPaymentMethodPresenter(view, this.subscriptionService);
  }

  updatePaymentMethod(view: View<SubscriptionDetailDto>) {
    return new UpdatePaymentMethodPresenter(view, this.subscriptionService);
  }

  removePaymentMethod(view: View<SubscriptionDetailDto>) {
    return new RemovePaymentMethodPresenter(view, this.subscriptionService);
  }

  setAutoDebit(view: View<SubscriptionDetailDto>) {
    return new SetAutoDebitPresenter(view, this.subscriptionService);
  }

  cancelSubscription(view: View<SubscriptionDetailDto>) {
    return new CancelSubscriptionPresenter(view, this.subscriptionService);
  }

  listPayments(view: View<PaymentPageDto>) {
    return new ListPaymentsPresenter(view, this.subscriptionService);
  }

  registerManualPayment(view: View<PaymentDto>) {
    return new RegisterManualPaymentPresenter(view, this.subscriptionService);
  }
}
