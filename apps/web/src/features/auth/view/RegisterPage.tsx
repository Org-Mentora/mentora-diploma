import { Link } from 'react-router';
import { Button } from '@/shared/ui/button';
import { FormField } from '@/shared/ui/form-field';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { useRegisterViewModel } from '../viewmodel/useRegisterViewModel';
import { AuthLayout } from './AuthLayout';

const FIELDS = [
  { name: 'firstName', label: 'First name', autoComplete: 'given-name' },
  { name: 'lastName', label: 'Last name', autoComplete: 'family-name' },
  { name: 'specialty', label: 'Specialty', autoComplete: 'off' },
  { name: 'licenseNumber', label: 'License number', autoComplete: 'off' },
  { name: 'email', label: 'Email', autoComplete: 'email', type: 'email' },
  { name: 'phone', label: 'Phone', autoComplete: 'tel', type: 'tel' },
  { name: 'password', label: 'Password', autoComplete: 'new-password', type: 'password' },
  {
    name: 'confirmPassword',
    label: 'Repeat password',
    autoComplete: 'new-password',
    type: 'password',
  },
] as const;

export function RegisterPage() {
  const { form, error, isSubmitting, passwordHint, logo, selectLogo, submit } =
    useRegisterViewModel();
  const { errors } = form.formState;

  return (
    <AuthLayout
      wide
      title="Create your account"
      description="Register as a professional and start a free trial."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-foreground underline">
            Log in
          </Link>
        </>
      }
    >
      <form className="grid gap-4 sm:grid-cols-2" noValidate onSubmit={submit}>
        {FIELDS.map((field) => (
          <FormField
            key={field.name}
            id={field.name}
            label={field.label}
            error={errors[field.name]?.message}
            {...(field.name === 'password' ? { hint: passwordHint } : {})}
          >
            <Input
              id={field.name}
              type={'type' in field ? field.type : 'text'}
              autoComplete={field.autoComplete}
              aria-invalid={!!errors[field.name]}
              {...form.register(field.name)}
            />
          </FormField>
        ))}
        <FormField
          id="offices"
          label="Office addresses (optional)"
          hint="One per line, up to 5. They are printed on prescriptions."
          error={errors.offices?.message}
          className="sm:col-span-2"
        >
          <Textarea id="offices" rows={2} {...form.register('offices')} />
        </FormField>
        <FormField
          id="logo"
          label="Logo (optional)"
          hint={logo.hint}
          error={logo.error ?? undefined}
          className="sm:col-span-2"
        >
          <div className="flex items-center gap-3">
            {logo.preview && (
              <img
                src={logo.preview}
                alt="Logo preview"
                className="size-12 rounded object-contain"
              />
            )}
            <Input
              id="logo"
              type="file"
              accept={logo.accept}
              onChange={(event) => void selectLogo(event.target.files?.[0] ?? null)}
            />
          </div>
        </FormField>
        {error && (
          <p role="alert" className="text-destructive text-sm sm:col-span-2">
            {error.message}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting} className="sm:col-span-2">
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
