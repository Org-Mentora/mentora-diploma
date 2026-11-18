import { z } from 'zod';
import { errorResponse } from '#core/contracts/ErrorResponse';
import { nullableRef } from '#core/contracts/nullableRef';
import { PageQuerySchema, pageOf } from '#core/contracts/Pagination';
import { type ContractRegistry, moduleRoutes } from '#core/module/ContractRegistry';

export const SubscriptionStatusSchema = z.enum([
  'trial',
  'active',
  'pending_payment',
  'suspended',
  'cancelled',
  'expired',
]);

const PlanIdSchema = z.enum(['monthly', 'annual']);

export const PlanSchema = z
  .object({
    id: PlanIdSchema,
    name: z.string(),
    description: z.string(),
    months: z.number().int(),
    price: z.number(),
    currency: z.string(),
  })
  .meta({ id: 'PlanDto' });

export const PaymentMethodSchema = z
  .object({
    id: z.uuid(),
    brand: z.enum(['visa', 'mastercard', 'amex', 'other']),
    label: z.string().meta({ example: 'Visa •••• 4242' }),
    last4: z.string(),
    expMonth: z.number().int(),
    expYear: z.number().int(),
    holderName: z.string(),
    isDefault: z.boolean(),
  })
  .meta({ id: 'PaymentMethodDto' });

export const SubscriptionSchema = z
  .object({
    status: SubscriptionStatusSchema,
    hasAccess: z.boolean(),
    plan: nullableRef(PlanSchema),
    currentPeriodEndsAt: z.iso.datetime(),
    daysLeft: z.number().int(),
    autoDebit: z.boolean(),
    paymentMethods: z.array(PaymentMethodSchema),
    cancelledAt: z.iso.datetime().nullable(),
    availablePlans: z.array(PlanSchema),
  })
  .meta({ id: 'SubscriptionDetailDto', description: 'CU-18 subscription panel' });

export const PaymentSchema = z
  .object({
    id: z.uuid(),
    planId: PlanIdSchema,
    amount: z.number(),
    currency: z.string(),
    kind: z.enum(['automatic', 'plan_change', 'manual']),
    status: z.enum(['approved', 'declined', 'failed']),
    methodLabel: z.string(),
    reference: z.string().nullable(),
    failureReason: z.string().nullable(),
    paidAt: z.iso.datetime(),
  })
  .meta({ id: 'PaymentDto' });

export const PaymentPageSchema = pageOf(PaymentSchema, 'PaymentPageDto');

export const ChoosePlanRequestSchema = z
  .object({ planId: PlanIdSchema })
  .meta({ id: 'ChoosePlanRequestDto' });

export const AddPaymentMethodRequestSchema = z
  .object({
    holderName: z.string().trim().min(1).max(120),
    cardNumber: z.string().trim().min(12).max(23).meta({ example: '4242 4242 4242 4242' }),
    expMonth: z.number().int().min(1).max(12),
    expYear: z.number().int().min(2000).max(2100),
    cvc: z.string().trim().min(3).max(4),
    makeDefault: z.boolean().optional(),
  })
  .meta({ id: 'AddPaymentMethodRequestDto' });

export const UpdatePaymentMethodRequestSchema = z
  .object({
    holderName: z.string().trim().min(1).max(120).optional(),
    expMonth: z.number().int().min(1).max(12).optional(),
    expYear: z.number().int().min(2000).max(2100).optional(),
    makeDefault: z.boolean().optional(),
  })
  .meta({ id: 'UpdatePaymentMethodRequestDto' });

export const AutoDebitRequestSchema = z
  .object({ enabled: z.boolean() })
  .meta({ id: 'AutoDebitRequestDto' });

export const ManualPaymentRequestSchema = z
  .object({
    amount: z.number().positive(),
    paidAt: z.iso.date().meta({ description: 'Day the payment was made' }),
    method: z.enum(['bank_transfer', 'cash', 'card', 'other']),
    reference: z.string().trim().max(120).nullable().optional(),
  })
  .meta({ id: 'ManualPaymentRequestDto' });

export const PaymentMethodIdParamsSchema = z.object({ id: z.uuid() });
export const RemovePaymentMethodQuerySchema = z.object({
  confirm: z
    .enum(['true', 'false'])
    .optional()
    .meta({ description: 'Required to remove the only card used for automatic debit' }),
});

export type PlanDto = z.infer<typeof PlanSchema>;
export type PaymentMethodDto = z.infer<typeof PaymentMethodSchema>;
export type SubscriptionDetailDto = z.infer<typeof SubscriptionSchema>;
export type PaymentDto = z.infer<typeof PaymentSchema>;
export type PaymentPageDto = z.infer<typeof PaymentPageSchema>;
export type ChoosePlanRequestDto = z.infer<typeof ChoosePlanRequestSchema>;
export type AddPaymentMethodRequestDto = z.infer<typeof AddPaymentMethodRequestSchema>;
export type UpdatePaymentMethodRequestDto = z.infer<typeof UpdatePaymentMethodRequestSchema>;
export type AutoDebitRequestDto = z.infer<typeof AutoDebitRequestSchema>;
export type ManualPaymentRequestDto = z.infer<typeof ManualPaymentRequestSchema>;

export function registerSubscriptionContracts(registry: ContractRegistry): void {
  const tags = ['Subscription', 'Auth'];
  const route = moduleRoutes(registry, { tags, auth: true });
  const invalid = errorResponse('Invalid data');
  const detail = (description: string) => ({ description, schema: SubscriptionSchema });

  route({
    method: 'get',
    path: '/subscription',
    operationId: 'getSubscription',
    summary: 'CU-18 Subscription panel: status, plan, payment methods and available plans',
    tags: ['Subscription'],
    responses: { 200: detail('Subscription') },
  });
  route({
    method: 'put',
    path: '/subscription/plan',
    operationId: 'choosePlan',
    summary: 'CU-18 Select or change the plan (charges now when there is no access)',
    request: { body: ChoosePlanRequestSchema },
    responses: {
      200: detail('Plan applied'),
      400: invalid,
      402: errorResponse('Payment declined'),
      409: errorResponse('A payment method is required'),
      503: errorResponse('Payment provider unavailable'),
    },
  });
  route({
    method: 'post',
    path: '/subscription/payment-methods',
    operationId: 'addPaymentMethod',
    summary: 'CU-18 Register a card (only a gateway token is stored)',
    request: { body: AddPaymentMethodRequestSchema },
    responses: { 201: detail('Card registered'), 400: invalid },
  });
  route({
    method: 'patch',
    path: '/subscription/payment-methods/{id}',
    operationId: 'updatePaymentMethod',
    summary: 'CU-18 Update holder, expiry or default card',
    request: { params: PaymentMethodIdParamsSchema, body: UpdatePaymentMethodRequestSchema },
    responses: { 200: detail('Card updated'), 400: invalid },
  });
  route({
    method: 'delete',
    path: '/subscription/payment-methods/{id}',
    operationId: 'removePaymentMethod',
    summary: 'CU-18 Remove a card',
    request: { params: PaymentMethodIdParamsSchema, query: RemovePaymentMethodQuerySchema },
    responses: {
      200: detail('Card removed'),
      400: invalid,
      409: errorResponse('Confirmation required'),
    },
  });
  route({
    method: 'put',
    path: '/subscription/auto-debit',
    operationId: 'setAutoDebit',
    summary: 'CU-18 Turn automatic debit on or off',
    request: { body: AutoDebitRequestSchema },
    responses: { 200: detail('Automatic debit updated'), 400: invalid },
  });
  route({
    method: 'post',
    path: '/subscription/cancel',
    operationId: 'cancelSubscription',
    summary: 'CU-18 Cancel the subscription (access lasts until the paid period ends)',
    responses: {
      200: detail('Subscription cancelled'),
      409: errorResponse('Already cancelled'),
    },
  });
  route({
    method: 'get',
    path: '/subscription/payments',
    operationId: 'listPayments',
    summary: 'CU-18 Payment history, newest first',
    tags: ['Subscription'],
    request: { query: PageQuerySchema },
    responses: { 200: { description: 'Payments', schema: PaymentPageSchema } },
  });
  route({
    method: 'post',
    path: '/subscription/payments',
    operationId: 'registerManualPayment',
    summary: 'CU-18 Register a manual payment for the current plan',
    request: { body: ManualPaymentRequestSchema },
    responses: { 201: { description: 'Payment registered', schema: PaymentSchema }, 400: invalid },
  });
}
