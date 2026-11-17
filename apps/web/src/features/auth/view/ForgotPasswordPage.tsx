import { Link } from 'react-router';
import { useTranslation } from '@/shared/i18n';
import { Button } from '@/shared/ui/button';
import { FormField } from '@/shared/ui/form-field';
import { Input } from '@/shared/ui/input';
import { useForgotPasswordViewModel } from '../viewmodel/useForgotPasswordViewModel';
import { AuthLayout } from './AuthLayout';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const vm = useForgotPasswordViewModel();

  return (
    <AuthLayout
      title={t('auth.recovery.title')}
      description={t(`auth.recovery.step.${vm.step}`)}
      footer={
        <Link to="/login" className="font-medium text-foreground underline">
          {t('auth.recovery.back')}
        </Link>
      }
    >
      {vm.step === 'email' && (
        <form className="grid gap-4" noValidate onSubmit={vm.requestCode}>
          <FormField
            id="email"
            label={t('auth.field.email')}
            error={vm.emailForm.formState.errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...vm.emailForm.register('email')}
            />
          </FormField>
          <Button type="submit" disabled={vm.isSubmitting}>
            {t('auth.recovery.send')}
          </Button>
        </form>
      )}

      {vm.step === 'code' && (
        <form className="grid gap-4" noValidate onSubmit={vm.verifyCode}>
          {vm.notice && <p className="text-muted-foreground text-sm">{vm.notice}</p>}
          <FormField
            id="code"
            label={t('auth.recovery.code')}
            error={vm.codeForm.formState.errors.code?.message}
          >
            <Input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              className="text-center font-mono text-lg tracking-[0.5em]"
              {...vm.codeForm.register('code')}
            />
          </FormField>
          <Button type="submit" disabled={vm.isSubmitting}>
            {t('auth.recovery.verify')}
          </Button>
          <div className="flex justify-between text-sm">
            <button type="button" className="underline" onClick={vm.startOver}>
              {t('auth.recovery.otherEmail')}
            </button>
            <button
              type="button"
              className="underline"
              onClick={() => void vm.resendCode()}
              disabled={vm.isSubmitting}
            >
              {t('auth.recovery.resend')}
            </button>
          </div>
        </form>
      )}

      {vm.step === 'password' && (
        <form className="grid gap-4" noValidate onSubmit={vm.resetPassword}>
          <FormField
            id="newPassword"
            label={t('auth.field.newPassword')}
            hint={vm.passwordHint}
            error={vm.passwordForm.formState.errors.newPassword?.message}
          >
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...vm.passwordForm.register('newPassword')}
            />
          </FormField>
          <FormField
            id="confirmPassword"
            label={t('auth.field.confirmNewPassword')}
            error={vm.passwordForm.formState.errors.confirmPassword?.message}
          >
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...vm.passwordForm.register('confirmPassword')}
            />
          </FormField>
          <Button type="submit" disabled={vm.isSubmitting}>
            {t('auth.recovery.change')}
          </Button>
        </form>
      )}

      {vm.error && (
        <p role="alert" className="text-destructive text-sm">
          {vm.error.message}
        </p>
      )}
    </AuthLayout>
  );
}
