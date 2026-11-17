import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useAddPaymentMethodMutation,
  useCancelSubscriptionMutation,
  useChoosePlanMutation,
  useGetSubscriptionQuery,
  useListPaymentsQuery,
  useRegisterManualPaymentMutation,
  useRemovePaymentMethodMutation,
  useSetAutoDebitMutation,
  useUpdatePaymentMethodMutation,
} from '@/model/api/generated/mentoraApi';
import { usePlanSettingsViewModel } from './usePlanSettingsViewModel';

vi.mock('@/model/api/generated/mentoraApi', () => ({
  useGetSubscriptionQuery: vi.fn(),
  useListPaymentsQuery: vi.fn(),
  useChoosePlanMutation: vi.fn(),
  useSetAutoDebitMutation: vi.fn(),
  useCancelSubscriptionMutation: vi.fn(),
  useAddPaymentMethodMutation: vi.fn(),
  useUpdatePaymentMethodMutation: vi.fn(),
  useRemovePaymentMethodMutation: vi.fn(),
  useRegisterManualPaymentMutation: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const monthly = {
  id: 'monthly',
  name: 'Monthly',
  description: '',
  months: 1,
  price: 25000,
  currency: 'ARS',
};

const expired = {
  status: 'expired',
  hasAccess: false,
  plan: null,
  currentPeriodEndsAt: '2030-01-15T12:00:00.000Z',
  daysLeft: 0,
  autoDebit: false,
  paymentMethods: [],
  cancelledAt: null,
  availablePlans: [monthly],
};

const choosePlan = vi.fn();
const removeCard = vi.fn();
const mutation = (fn = vi.fn()) => [fn, { isLoading: false }];

function rejectWith(code: string, message: string) {
  return {
    unwrap: () => Promise.reject({ status: 409, data: { error: { code, message, details: {} } } }),
  };
}

describe('usePlanSettingsViewModel (CU-18)', () => {
  beforeEach(() => {
    vi.mocked(useGetSubscriptionQuery).mockReturnValue({
      data: expired,
      isLoading: false,
    } as unknown as ReturnType<typeof useGetSubscriptionQuery>);
    vi.mocked(useListPaymentsQuery).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useListPaymentsQuery>);
    choosePlan.mockReset();
    removeCard.mockReset();
    vi.mocked(useChoosePlanMutation).mockReturnValue(mutation(choosePlan) as never);
    vi.mocked(useSetAutoDebitMutation).mockReturnValue(mutation() as never);
    vi.mocked(useCancelSubscriptionMutation).mockReturnValue(mutation() as never);
    vi.mocked(useAddPaymentMethodMutation).mockReturnValue(mutation() as never);
    vi.mocked(useUpdatePaymentMethodMutation).mockReturnValue(mutation() as never);
    vi.mocked(useRemovePaymentMethodMutation).mockReturnValue(mutation(removeCard) as never);
    vi.mocked(useRegisterManualPaymentMutation).mockReturnValue(mutation() as never);
  });

  it('warns that choosing a plan without access charges now', () => {
    const { result } = renderHook(() => usePlanSettingsViewModel());
    const [plan] = result.current.plans;

    act(() => plan && result.current.requestPlan(plan));

    expect(result.current.overview?.needsAction).toBe(true);
    expect(result.current.pendingPlan).toMatchObject({ chargesNow: true });
  });

  it('opens the add-card dialog when the plan needs a payment method (step 5 alternative)', async () => {
    choosePlan.mockReturnValue(rejectWith('PAYMENT_METHOD_REQUIRED', 'Register a payment method'));
    const { result } = renderHook(() => usePlanSettingsViewModel());
    const [plan] = result.current.plans;

    act(() => plan && result.current.requestPlan(plan));
    await act(() => result.current.confirmPlan());

    expect(result.current.pendingPlan).toBeNull();
    expect(result.current.cards.isAddOpen).toBe(true);
    expect(result.current.cards.addNotice).toContain('Add a card');
  });

  it('asks a second confirmation to remove the only automatic-debit card', async () => {
    removeCard
      .mockReturnValueOnce(rejectWith('CONFIRMATION_REQUIRED', 'This is the only card.'))
      .mockReturnValueOnce({ unwrap: () => Promise.resolve({}) });
    const { result } = renderHook(() => usePlanSettingsViewModel());
    const card = {
      id: 'c-1',
      label: 'Visa •••• 4242',
      holderName: 'Ana',
      expiry: '12/35',
      expMonth: 12,
      expYear: 2035,
      isDefault: true,
    };

    act(() => result.current.cards.requestRemove(card));
    await act(() => result.current.cards.confirmRemove());
    expect(result.current.cards.removal?.warning).toBe('This is the only card.');

    await act(() => result.current.cards.confirmRemove());
    expect(removeCard).toHaveBeenLastCalledWith({ id: 'c-1', confirm: 'true' });
    expect(result.current.cards.removal).toBeNull();
  });
});
