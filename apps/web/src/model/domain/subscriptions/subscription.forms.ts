import type {
  AddPaymentMethodRequestDto,
  ManualPaymentRequestDto,
  UpdatePaymentMethodRequestDto,
} from '@mentora/contracts';
import { z } from 'zod';

const EXPIRY = /^(0[1-9]|1[0-2])\/(\d{2})$/;

export const cardFormSchema = z.object({
  holderName: z.string().trim().min(1, 'validation.required'),
  cardNumber: z
    .string()
    .refine((value) => /^\d{12,19}$/.test(value.replace(/[\s-]/g, '')), 'validation.cardNumber'),
  expiry: z.string().trim().regex(EXPIRY, 'validation.expiry'),
  cvc: z
    .string()
    .trim()
    .regex(/^\d{3,4}$/, '3 or 4 digits'),
  makeDefault: z.boolean(),
});

export const editCardFormSchema = z.object({
  holderName: z.string().trim().min(1, 'validation.required'),
  expiry: z.string().trim().regex(EXPIRY, 'validation.expiry'),
});

export const manualPaymentFormSchema = z.object({
  amount: z.string().refine((value) => Number(value) > 0, 'validation.amountPaid'),
  paidAt: z.iso.date('validation.paymentDate'),
  method: z.enum(['bank_transfer', 'cash', 'card', 'other']),
  reference: z.string(),
});

export type CardFormValues = z.infer<typeof cardFormSchema>;
export type EditCardFormValues = z.infer<typeof editCardFormSchema>;
export type ManualPaymentFormValues = z.infer<typeof manualPaymentFormSchema>;

export const emptyCardForm: CardFormValues = {
  holderName: '',
  cardNumber: '',
  expiry: '',
  cvc: '',
  makeDefault: false,
};

export const MANUAL_METHOD_LABEL: Record<ManualPaymentFormValues['method'], string> = {
  bank_transfer: 'subscription.manualMethod.bank_transfer',
  cash: 'subscription.manualMethod.cash',
  card: 'subscription.manualMethod.card',
  other: 'subscription.manualMethod.other',
};

function parseExpiry(expiry: string): { expMonth: number; expYear: number } {
  const [, month, year] = EXPIRY.exec(expiry.trim()) ?? [];
  return { expMonth: Number(month), expYear: 2000 + Number(year) };
}

export class SubscriptionForms {
  static toAddCard(values: CardFormValues): AddPaymentMethodRequestDto {
    return {
      holderName: values.holderName.trim(),
      cardNumber: values.cardNumber.replace(/[\s-]/g, ''),
      cvc: values.cvc.trim(),
      makeDefault: values.makeDefault,
      ...parseExpiry(values.expiry),
    };
  }

  static toEditCard(values: EditCardFormValues): UpdatePaymentMethodRequestDto {
    return { holderName: values.holderName.trim(), ...parseExpiry(values.expiry) };
  }

  static manualDefaults(price: number | null, today: string): ManualPaymentFormValues {
    return {
      amount: price ? String(price) : '',
      paidAt: today,
      method: 'bank_transfer',
      reference: '',
    };
  }

  static toManualPayment(values: ManualPaymentFormValues): ManualPaymentRequestDto {
    return {
      amount: Number(values.amount),
      paidAt: values.paidAt,
      method: values.method,
      reference: values.reference.trim() || null,
    };
  }
}
