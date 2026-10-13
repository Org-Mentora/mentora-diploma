import { Link } from 'react-router';
import { Button } from '@/shared/ui/button';
import { FormField } from '@/shared/ui/form-field';
import { Input } from '@/shared/ui/input';
import { useLoginViewModel } from '../viewmodel/useLoginViewModel';
import { AuthLayout } from './AuthLayout';

/** CU-01 Log in. */
export function LoginPage() {
  const { form, error, isSubmitting, submit } = useLoginViewModel();
  const { errors } = form.formState;

  return (
    <AuthLayout
      title="Log in"
      description="Enter your email and password to access your practice."
      footer={
        <>
          New to Mentora?{' '}
          <Link to="/register" className="font-medium text-foreground underline">
            Create an account
          </Link>
        </>
      }
    >
      <form className="grid gap-4" noValidate onSubmit={submit}>
        <FormField id="email" label="Email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...form.register('email')}
          />
        </FormField>
        <FormField id="password" label="Password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...form.register('password')}
          />
        </FormField>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error.message}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
