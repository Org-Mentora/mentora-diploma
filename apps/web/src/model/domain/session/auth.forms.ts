import type {
  ChangePasswordRequestDto,
  LoginRequestDto,
  ProfessionalDto,
  RegisterProfessionalRequestDto,
  UpdateProfileRequestDto,
} from '@mentora/contracts';
import { z } from 'zod';

export const passwordRules = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[a-zA-Z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number');

export const PASSWORD_HINT = 'At least 8 characters, with letters and numbers';

export const loginFormSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});

const profileShape = {
  firstName: z.string().trim().min(1, 'Required'),
  lastName: z.string().trim().min(1, 'Required'),
  specialty: z.string().trim().min(1, 'Required'),
  licenseNumber: z.string().trim().min(1, 'Required'),
  email: z.email('Enter a valid email'),
  phone: z.string().trim().min(6, 'Enter a valid phone'),
  offices: z.string().refine((value) => AuthForms.offices(value).length <= 5, 'Up to 5 offices'),
};

export const registerFormSchema = z
  .object({ ...profileShape, password: passwordRules, confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const profileFormSchema = z.object(profileShape);

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordRules,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const recoveryEmailSchema = z.object({ email: z.email('Enter a valid email') });
export const recoveryCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'The code has 6 digits'),
});
export const recoveryPasswordSchema = z
  .object({ newPassword: passwordRules, confirmPassword: z.string() })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type ProfileFormValues = z.infer<typeof profileFormSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
export type RecoveryEmailValues = z.infer<typeof recoveryEmailSchema>;
export type RecoveryCodeValues = z.infer<typeof recoveryCodeSchema>;
export type RecoveryPasswordValues = z.infer<typeof recoveryPasswordSchema>;

export const registerFormDefaults: RegisterFormValues = {
  firstName: '',
  lastName: '',
  specialty: 'Psychiatry',
  licenseNumber: '',
  email: '',
  phone: '',
  offices: '',
  password: '',
  confirmPassword: '',
};

export const changePasswordDefaults: ChangePasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export class AuthForms {
  static offices(text: string): string[] {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  static toLoginRequest(values: LoginFormValues): LoginRequestDto {
    return { email: values.email, password: values.password };
  }

  static toRegisterRequest(values: RegisterFormValues): RegisterProfessionalRequestDto {
    const { confirmPassword: _confirm, offices, ...request } = values;
    return { ...request, offices: AuthForms.offices(offices) };
  }

  static profileFromDto(dto: ProfessionalDto): ProfileFormValues {
    return {
      firstName: dto.firstName,
      lastName: dto.lastName,
      specialty: dto.specialty,
      licenseNumber: dto.licenseNumber,
      email: dto.email,
      phone: dto.phone,
      offices: dto.offices.join('\n'),
    };
  }

  static toProfileRequest(values: ProfileFormValues): UpdateProfileRequestDto {
    return { ...values, offices: AuthForms.offices(values.offices) };
  }

  static toChangePasswordRequest(values: ChangePasswordFormValues): ChangePasswordRequestDto {
    return { currentPassword: values.currentPassword, newPassword: values.newPassword };
  }
}
