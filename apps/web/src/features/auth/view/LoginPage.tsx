import { Link } from 'react-router';
import { useTranslation } from '@/shared/i18n';
import { Button } from '@/shared/ui/button';
import { FormField } from '@/shared/ui/form-field';
import { Input } from '@/shared/ui/input';
import { useLoginViewModel } from '../viewmodel/useLoginViewModel';
import { AuthLayout } from './AuthLayout';

export function LoginPage() {
  const { t } = useTranslation();
  const { form, error, isSubmitting, submit } = useLoginViewModel();
  const { errors } = form.formState;

  return (
    <AuthLayout
      title={t('auth.login.title')}
      description={t('auth.login.description')}
      footer={
        <>
          {t('auth.login.newHere')}{' '}
          <Link to="/register" className="font-medium text-foreground underline">
            {t('auth.login.createAccount')}
          </Link>
        </>
      }
    >
      <form className="grid gap-4" noValidate onSubmit={submit}>
        <FormField id="email" label={t('auth.field.email')} error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...form.register('email')}
          />
        </FormField>
        <FormField id="password" label={t('auth.field.password')} error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...form.register('password')}
          />
        </FormField>
        <Link
          to="/forgot-password"
          className="-mt-2 w-fit text-muted-foreground text-sm underline hover:text-foreground"
        >
          {t('auth.login.forgot')}
        </Link>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error.message}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('auth.login.submitting') : t('auth.login.submit')}
        </Button>
      </form>
    </AuthLayout>
  );
}
