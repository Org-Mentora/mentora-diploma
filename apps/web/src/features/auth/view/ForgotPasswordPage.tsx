import { Link } from 'react-router';
import { Button } from '@/shared/ui/button';
import { FormField } from '@/shared/ui/form-field';
import { Input } from '@/shared/ui/input';
import { useForgotPasswordViewModel } from '../viewmodel/useForgotPasswordViewModel';
import { AuthLayout } from './AuthLayout';

const DESCRIPTION = {
  email: 'Enter the email of your account and we will send you a recovery code.',
  code: 'Enter the 6-digit code we sent you.',
  password: 'Choose your new password.',
} as const;

export function ForgotPasswordPage() {
  const vm = useForgotPasswordViewModel();

  return (
    <AuthLayout
      title="Recover your password"
      description={DESCRIPTION[vm.step]}
      footer={
        <Link to="/login" className="font-medium text-foreground underline">
          Back to log in
        </Link>
      }
    >
      {vm.step === 'email' && (
        <form className="grid gap-4" noValidate onSubmit={vm.requestCode}>
          <FormField id="email" label="Email" error={vm.emailForm.formState.errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...vm.emailForm.register('email')}
            />
          </FormField>
          <Button type="submit" disabled={vm.isSubmitting}>
            Send code
          </Button>
        </form>
      )}

      {vm.step === 'code' && (
        <form className="grid gap-4" noValidate onSubmit={vm.verifyCode}>
          {vm.notice && <p className="text-muted-foreground text-sm">{vm.notice}</p>}
          <FormField id="code" label="Code" error={vm.codeForm.formState.errors.code?.message}>
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
            Verify code
          </Button>
          <div className="flex justify-between text-sm">
            <button type="button" className="underline" onClick={vm.startOver}>
              Use another email
            </button>
            <button
              type="button"
              className="underline"
              onClick={() => void vm.resendCode()}
              disabled={vm.isSubmitting}
            >
              Send a new code
            </button>
          </div>
        </form>
      )}

      {vm.step === 'password' && (
        <form className="grid gap-4" noValidate onSubmit={vm.resetPassword}>
          <FormField
            id="newPassword"
            label="New password"
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
            label="Repeat the new password"
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
            Change password
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
