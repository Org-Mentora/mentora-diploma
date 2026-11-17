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
    offices: z.array(z.string()),
    hasLogo: z.boolean(),
  })
  .meta({ id: 'ProfessionalDto' });

export const SubscriptionSchema = z
  .object({
    status: z.enum(['trial', 'active', 'pending_payment', 'suspended', 'cancelled', 'expired']),
    hasAccess: z.boolean().meta({ description: 'false: only the plan page is available' }),
    accessEndsAt: z.iso.datetime(),
    daysLeft: z.number().int(),
  })
  .meta({ id: 'SubscriptionDto' });

export const SessionSchema = z
  .object({
    professional: ProfessionalSchema,
    subscription: SubscriptionSchema,
  })
  .meta({ id: 'SessionDto', description: 'The authenticated professional and their access' });

const passwordField = z.string().min(8).max(128);
const officesField = z.array(z.string().trim().min(1).max(200)).max(5);

const profileShape = {
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email().max(160),
  phone: z.string().trim().min(6).max(30),
  specialty: z.string().trim().min(1).max(120),
  licenseNumber: z.string().trim().min(1).max(40),
};

export const RegisterProfessionalRequestSchema = z
  .object({ ...profileShape, password: passwordField, offices: officesField.optional() })
  .meta({ id: 'RegisterProfessionalRequestDto' });

export const UpdateProfileRequestSchema = z
  .object({ ...profileShape, offices: officesField })
  .meta({ id: 'UpdateProfileRequestDto' });

export const LoginRequestSchema = z
  .object({
    email: z.email(),
    password: z.string().min(1).max(128),
  })
  .meta({ id: 'LoginRequestDto' });

export const ChangePasswordRequestSchema = z
  .object({ currentPassword: z.string().min(1).max(128), newPassword: passwordField })
  .meta({ id: 'ChangePasswordRequestDto' });

export const PasswordRecoveryRequestSchema = z
  .object({ email: z.email() })
  .meta({ id: 'PasswordRecoveryRequestDto' });

const codeField = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'The code has 6 digits');

export const VerifyRecoveryCodeRequestSchema = z
  .object({ email: z.email(), code: codeField })
  .meta({ id: 'VerifyRecoveryCodeRequestDto' });

export const ResetPasswordRequestSchema = z
  .object({ email: z.email(), code: codeField, newPassword: passwordField })
  .meta({ id: 'ResetPasswordRequestDto' });

export const RecoveryRequestedSchema = z
  .object({ message: z.string() })
  .meta({ id: 'RecoveryRequestedDto' });

export const LogoSchema = z
  .object({
    dataUrl: z
      .string()
      .nullable()
      .meta({ description: 'PNG or JPEG data URL; null when the default logo is used' }),
  })
  .meta({ id: 'LogoDto' });

export const UploadLogoRequestSchema = z
  .object({
    dataUrl: z
      .string()
      .max(720_000)
      .meta({ description: 'data:image/png;base64,... or data:image/jpeg;base64,... (512 KB)' }),
  })
  .meta({ id: 'UploadLogoRequestDto' });

export type ProfessionalDto = z.infer<typeof ProfessionalSchema>;
export type SessionDto = z.infer<typeof SessionSchema>;
export type RegisterProfessionalRequestDto = z.infer<typeof RegisterProfessionalRequestSchema>;
export type UpdateProfileRequestDto = z.infer<typeof UpdateProfileRequestSchema>;
export type LoginRequestDto = z.infer<typeof LoginRequestSchema>;
export type ChangePasswordRequestDto = z.infer<typeof ChangePasswordRequestSchema>;
export type PasswordRecoveryRequestDto = z.infer<typeof PasswordRecoveryRequestSchema>;
export type VerifyRecoveryCodeRequestDto = z.infer<typeof VerifyRecoveryCodeRequestSchema>;
export type ResetPasswordRequestDto = z.infer<typeof ResetPasswordRequestSchema>;
export type RecoveryRequestedDto = z.infer<typeof RecoveryRequestedSchema>;
export type LogoDto = z.infer<typeof LogoSchema>;
export type UploadLogoRequestDto = z.infer<typeof UploadLogoRequestSchema>;

export function registerAuthContracts(registry: ContractRegistry): void {
  const tags = ['Auth'];
  const invalid = { description: 'Invalid data', schema: ErrorResponseSchema };
  const session = (description: string) => ({ description, schema: SessionSchema });

  registry.registerRoute({
    method: 'post',
    path: '/auth/register',
    operationId: 'registerProfessional',
    summary: 'CU-03 Register a professional and start the free trial (sets the session cookie)',
    tags,
    request: { body: RegisterProfessionalRequestSchema },
    responses: {
      201: session('Account created and logged in'),
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
      200: session('Logged in'),
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
    summary: 'Current session; refreshes the cookie with the current access',
    tags,
    auth: true,
    responses: { 200: session('Current session') },
  });
  registry.registerRoute({
    method: 'post',
    path: '/auth/password-recovery',
    operationId: 'requestPasswordRecovery',
    summary: 'CU-02 Email a recovery code (same answer whether the email exists or not)',
    tags,
    request: { body: PasswordRecoveryRequestSchema },
    responses: {
      202: { description: 'Code sent if the account exists', schema: RecoveryRequestedSchema },
      400: invalid,
    },
  });
  registry.registerRoute({
    method: 'post',
    path: '/auth/password-recovery/verify',
    operationId: 'verifyRecoveryCode',
    summary: 'CU-02 Check a recovery code before asking for the new password',
    tags,
    request: { body: VerifyRecoveryCodeRequestSchema },
    responses: { 204: { description: 'Valid code' }, 400: invalid },
  });
  registry.registerRoute({
    method: 'post',
    path: '/auth/password-recovery/reset',
    operationId: 'resetPassword',
    summary: 'CU-02 Set a new password with a valid recovery code',
    tags,
    request: { body: ResetPasswordRequestSchema },
    responses: { 204: { description: 'Password changed' }, 400: invalid },
  });
  registry.registerRoute({
    method: 'put',
    path: '/auth/password',
    operationId: 'changePassword',
    summary: 'CU-17 Change the password (requires the current one)',
    tags,
    auth: true,
    request: { body: ChangePasswordRequestSchema },
    responses: { 200: session('Password changed; the session cookie is re-issued'), 400: invalid },
  });
  registry.registerRoute({
    method: 'put',
    path: '/auth/profile',
    operationId: 'updateProfile',
    summary: 'CU-16 Update the professional data and offices',
    tags,
    auth: true,
    request: { body: UpdateProfileRequestSchema },
    responses: {
      200: session('Profile updated'),
      400: invalid,
      409: {
        description: 'Email or license number already registered',
        schema: ErrorResponseSchema,
      },
    },
  });
  registry.registerRoute({
    method: 'get',
    path: '/auth/logo',
    operationId: 'getLogo',
    summary: 'CU-13/CU-16 The professional logo used on prescriptions',
    tags,
    auth: true,
    responses: { 200: { description: 'Logo', schema: LogoSchema } },
  });
  registry.registerRoute({
    method: 'put',
    path: '/auth/logo',
    operationId: 'uploadLogo',
    summary: 'CU-16 Upload or replace the logo (PNG or JPEG, up to 512 KB)',
    tags,
    auth: true,
    request: { body: UploadLogoRequestSchema },
    responses: { 204: { description: 'Logo saved' }, 400: invalid },
  });
  registry.registerRoute({
    method: 'delete',
    path: '/auth/logo',
    operationId: 'removeLogo',
    summary: 'CU-16 Remove the logo (prescriptions use the default one)',
    tags,
    auth: true,
    responses: { 204: { description: 'Logo removed' } },
  });
}
