import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { ApiErrorAdapter } from '@/model/api/ApiErrorAdapter';
import {
  useAddPaymentMethodMutation,
  useRemovePaymentMethodMutation,
  useUpdatePaymentMethodMutation,
} from '@/model/api/generated/mentoraApi';
import type { PaymentMethodItem } from '@/model/domain/subscriptions/SubscriptionAdapter';
import {
  type CardFormValues,
  cardFormSchema,
  type EditCardFormValues,
  editCardFormSchema,
  emptyCardForm,
  SubscriptionForms,
} from '@/model/domain/subscriptions/subscription.forms';
import { useUserFeedback } from '@/model/platform/Platform';
import { useTranslation } from '@/shared/i18n';

export type { CardFormValues, EditCardFormValues, PaymentMethodItem };

export interface PendingRemoval {
  item: PaymentMethodItem;
  warning: string | null;
}

export interface PaymentMethodsViewModel {
  items: PaymentMethodItem[];
  isSaving: boolean;
  isAddOpen: boolean;
  addNotice: string | null;
  addForm: UseFormReturn<CardFormValues>;
  openAdd: (notice?: string) => void;
  closeAdd: () => void;
  submitAdd: () => Promise<void>;
  editing: PaymentMethodItem | null;
  editForm: UseFormReturn<EditCardFormValues>;
  startEdit: (item: PaymentMethodItem) => void;
  closeEdit: () => void;
  submitEdit: () => Promise<void>;
  makeDefault: (item: PaymentMethodItem) => Promise<void>;
  removal: PendingRemoval | null;
  requestRemove: (item: PaymentMethodItem) => void;
  abortRemove: () => void;
  confirmRemove: () => Promise<void>;
}

const CARD_FIELDS = new Set(['holderName', 'cardNumber', 'cvc']);

// ViewModel
export function usePaymentMethodsViewModel(items: PaymentMethodItem[]): PaymentMethodsViewModel {
  const { t } = useTranslation();
  const feedback = useUserFeedback();
  const [add, adding] = useAddPaymentMethodMutation();
  const [update, updating] = useUpdatePaymentMethodMutation();
  const [remove, removing] = useRemovePaymentMethodMutation();
  const [isAddOpen, setAddOpen] = useState(false);
  const [addNotice, setAddNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<PaymentMethodItem | null>(null);
  const [removal, setRemoval] = useState<PendingRemoval | null>(null);

  const addForm = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: emptyCardForm,
  });
  const editForm = useForm<EditCardFormValues>({
    resolver: zodResolver(editCardFormSchema),
    defaultValues: { holderName: '', expiry: '' },
  });

  const closeAdd = () => {
    setAddOpen(false);
    setAddNotice(null);
    addForm.reset(emptyCardForm);
  };

  return {
    items,
    isSaving: adding.isLoading || updating.isLoading || removing.isLoading,
    isAddOpen,
    addNotice,
    addForm,
    openAdd: (notice) => {
      setAddNotice(notice ?? null);
      addForm.reset({ ...emptyCardForm, makeDefault: items.length === 0 });
      setAddOpen(true);
    },
    closeAdd,
    submitAdd: addForm.handleSubmit(async (values) => {
      try {
        await add({ addPaymentMethodRequestDto: SubscriptionForms.toAddCard(values) }).unwrap();
        feedback.success(t('settings.cards.registered'));
        closeAdd();
      } catch (caught) {
        const error = ApiErrorAdapter.toUiError(caught);
        const field = error?.field;
        if (field && CARD_FIELDS.has(field)) {
          addForm.setError(field as keyof CardFormValues, { message: error.message });
        } else if (field === 'expYear' || field === 'expMonth') {
          addForm.setError('expiry', { message: error?.message ?? t('validation.expiry') });
        } else {
          addForm.setError('root', { message: error?.message ?? t('settings.cards.addFailed') });
        }
      }
    }),
    editing,
    editForm,
    startEdit: (item) => {
      editForm.reset({ holderName: item.holderName, expiry: item.expiry });
      setEditing(item);
    },
    closeEdit: () => setEditing(null),
    submitEdit: editForm.handleSubmit(async (values) => {
      if (!editing) {
        return;
      }
      try {
        await update({
          id: editing.id,
          updatePaymentMethodRequestDto: SubscriptionForms.toEditCard(values),
        }).unwrap();
        feedback.success(t('settings.cards.updated'));
        setEditing(null);
      } catch (caught) {
        editForm.setError('expiry', {
          message: ApiErrorAdapter.toUiError(caught)?.message ?? t('settings.cards.updateFailed'),
        });
      }
    }),
    makeDefault: async (item) => {
      try {
        await update({
          id: item.id,
          updatePaymentMethodRequestDto: { makeDefault: true },
        }).unwrap();
        feedback.success(`${item.label} is now the default card`);
      } catch (caught) {
        feedback.error(
          ApiErrorAdapter.toUiError(caught)?.message ?? t('settings.cards.updateFailed'),
        );
      }
    },
    removal,
    requestRemove: (item) => setRemoval({ item, warning: null }),
    abortRemove: () => setRemoval(null),
    confirmRemove: async () => {
      if (!removal) {
        return;
      }
      try {
        await remove({
          id: removal.item.id,
          ...(removal.warning ? { confirm: 'true' as const } : {}),
        }).unwrap();
        feedback.success(t('settings.cards.removed'));
        setRemoval(null);
      } catch (caught) {
        const error = ApiErrorAdapter.toUiError(caught);
        if (error?.code === 'CONFIRMATION_REQUIRED') {
          setRemoval({ item: removal.item, warning: error.message });
        } else {
          feedback.error(error?.message ?? t('settings.cards.removeFailed'));
          setRemoval(null);
        }
      }
    },
  };
}
