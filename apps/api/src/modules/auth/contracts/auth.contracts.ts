import { z } from 'zod';
import { ErrorResponseSchema } from '#core/contracts/ErrorResponse';
import type { ContractRegistry } from '#core/module/ContractRegistry';

export const ProfessionalSchema = z
  .object({
    id: z.uuid(),
    firstName: z.string(),
    lastName: z.string(),
    fullName: z.string(),
    email: z.email(),
    phone: z.string(),
    specialty: z.string(),
    licenseNumber: z.string(),
  })
  .meta({ id: 'ProfessionalDto' });

export const SubscriptionSchema = z
  .object({
    status: z.enum(['trial', 'active', 'expired']),
    accessEndsAt: z.iso.datetime().nullable(),
    daysLeft: z.number().int().nullable(),
  })
  .meta({ id: 'SubscriptionDto' });

export const SessionSchema = z
  .object({
    professional: ProfessionalSchema,
    subscription: SubscriptionSchema,
  })
  .meta({ id: 'SessionDto', description: 'The authenticated professional and their access' });

export const RegisterProfessionalRequestSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.email().max(160),
    phone: z.string().trim().min(6).max(30),
    specialty: z.string().trim().min(1).max(120),
    licenseNumber: z.string().trim().min(1).max(40),
    password: z.string().min(8).max(128),
  })
  .meta({ id: 'RegisterProfessionalRequestDto' });

export const LoginRequestSchema = z
  .object({
    email: z.email(),
    password: z.string().min(1),
  })
  .meta({ id: 'LoginRequestDto' });

export type ProfessionalDto = z.infer<typeof ProfessionalSchema>;
export type SessionDto = z.infer<typeof SessionSchema>;
export type RegisterProfessionalRequestDto = z.infer<typeof RegisterProfessionalRequestSchema>;
export type LoginRequestDto = z.infer<typeof LoginRequestSchema>;

export function registerAuthContracts(registry: ContractRegistry): void {
  const tags = ['Auth'];
  registry.registerRoute({
    method: 'post',
    path: '/auth/register',
    operationId: 'registerProfessional',
    summary: 'CU-03 Register a professional and start the free trial (sets the session cookie)',
    tags,
    request: { body: RegisterProfessionalRequestSchema },
    responses: {
      201: { description: 'Account created and logged in', schema: SessionSchema },
      400: { description: 'Invalid data or weak password', schema: ErrorResponseSchema },
      409: {
        description: 'Email or license number already registered',
        schema: ErrorResponseSchema,
      },
    },
  });
  registry.registerRoute({
    method: 'post',
    path: '/auth/login',
    operationId: 'login',
    summary: 'CU-01 Log in with email and password (sets the session cookie)',
    tags,
    request: { body: LoginRequestSchema },
    responses: {
      200: { description: 'Logged in', schema: SessionSchema },
      400: { description: 'Missing fields', schema: ErrorResponseSchema },
      401: { description: 'Invalid email or password', schema: ErrorResponseSchema },
    },
  });
  registry.registerRoute({
    method: 'post',
    path: '/auth/logout',
    operationId: 'logout',
    summary: 'Close the session (clears the session cookie)',
    tags,
    responses: { 204: { description: 'Logged out' } },
  });
  registry.registerRoute({
    method: 'get',
    path: '/auth/me',
    operationId: 'getCurrentProfessional',
    summary: 'Current session (works with an expired subscription)',
    tags,
    auth: true,
    responses: { 200: { description: 'Current session', schema: SessionSchema } },
  });
}
