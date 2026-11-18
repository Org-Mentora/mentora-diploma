import type { View } from '#core/view/View';
import type {
  PaymentDto,
  PaymentPageDto,
  SubscriptionDetailDto,
} from '../contracts/subscriptions.contracts';
import type { AddPaymentMethodPresenter } from './AddPaymentMethodPresenter';
import type { CancelSubscriptionPresenter } from './CancelSubscriptionPresenter';
import type { ChoosePlanPresenter } from './ChoosePlanPresenter';
import type { GetSubscriptionPresenter } from './GetSubscriptionPresenter';
import type { ListPaymentsPresenter } from './ListPaymentsPresenter';
import type { RegisterManualPaymentPresenter } from './RegisterManualPaymentPresenter';
import type { RemovePaymentMethodPresenter } from './RemovePaymentMethodPresenter';
import type { SetAutoDebitPresenter } from './SetAutoDebitPresenter';
import type { UpdatePaymentMethodPresenter } from './UpdatePaymentMethodPresenter';

// Abstract Factory
export interface SubscriptionPresenterFactory {
  getSubscription(view: View<SubscriptionDetailDto>): GetSubscriptionPresenter;
  choosePlan(view: View<SubscriptionDetailDto>): ChoosePlanPresenter;
  addPaymentMethod(view: View<SubscriptionDetailDto>): AddPaymentMethodPresenter;
  updatePaymentMethod(view: View<SubscriptionDetailDto>): UpdatePaymentMethodPresenter;
  removePaymentMethod(view: View<SubscriptionDetailDto>): RemovePaymentMethodPresenter;
  setAutoDebit(view: View<SubscriptionDetailDto>): SetAutoDebitPresenter;
  cancelSubscription(view: View<SubscriptionDetailDto>): CancelSubscriptionPresenter;
  listPayments(view: View<PaymentPageDto>): ListPaymentsPresenter;
  registerManualPayment(view: View<PaymentDto>): RegisterManualPaymentPresenter;
}
