import type { LoginRequestDto, RegisterProfessionalRequestDto } from '@mentora/contracts';
import { z } from 'zod';

/** Client-side validation mirroring the API contract (ADR-0021). */
export const loginFormSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});

export const registerFormSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Required'),
    lastName: z.string().trim().min(1, 'Required'),
    specialty: z.string().trim().min(1, 'Required'),
    licenseNumber: z.string().trim().min(1, 'Required'),
    email: z.email('Enter a valid email'),
    phone: z.string().trim().min(6, 'Enter a valid phone'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[a-zA-Z]/, 'Include at least one letter')
      .regex(/\d/, 'Include at least one number'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const registerFormDefaults: RegisterFormValues = {
  firstName: '',
  lastName: '',
  specialty: 'Psychiatry',
  licenseNumber: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

export class AuthForms {
  static toLoginRequest(values: LoginFormValues): LoginRequestDto {
    return { email: values.email, password: values.password };
  }

  static toRegisterRequest(values: RegisterFormValues): RegisterProfessionalRequestDto {
    const { confirmPassword: _confirm, ...request } = values;
    return request;
  }
}
