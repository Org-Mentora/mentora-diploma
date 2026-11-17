import { Link } from 'react-router';
import { useTranslation } from '@/shared/i18n';
import { Button } from '@/shared/ui/button';
import { FormField } from '@/shared/ui/form-field';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { useRegisterViewModel } from '../viewmodel/useRegisterViewModel';
import { AuthLayout } from './AuthLayout';

const FIELDS = [
  { name: 'firstName', label: 'auth.field.firstName', autoComplete: 'given-name' },
  { name: 'lastName', label: 'auth.field.lastName', autoComplete: 'family-name' },
  { name: 'specialty', label: 'auth.field.specialty', autoComplete: 'off' },
  { name: 'licenseNumber', label: 'auth.field.licenseNumber', autoComplete: 'off' },
  { name: 'email', label: 'auth.field.email', autoComplete: 'email', type: 'email' },
  { name: 'phone', label: 'auth.field.phone', autoComplete: 'tel', type: 'tel' },
  {
    name: 'password',
    label: 'auth.field.password',
    autoComplete: 'new-password',
    type: 'password',
  },
  {
    name: 'confirmPassword',
    label: 'auth.field.confirmPassword',
    autoComplete: 'new-password',
    type: 'password',
  },
] as const;

export function RegisterPage() {
  const { t } = useTranslation();
  const { form, error, isSubmitting, passwordHint, logo, selectLogo, submit } =
    useRegisterViewModel();
  const { errors } = form.formState;

  return (
    <AuthLayout
      wide
      title={t('auth.register.title')}
      description={t('auth.register.description')}
      footer={
        <>
          {t('auth.register.haveAccount')}{' '}
          <Link to="/login" className="font-medium text-foreground underline">
            {t('auth.login.submit')}
          </Link>
        </>
      }
    >
      <form className="grid gap-4 sm:grid-cols-2" noValidate onSubmit={submit}>
        {FIELDS.map((field) => (
          <FormField
            key={field.name}
            id={field.name}
            label={t(field.label)}
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
          label={t('auth.field.offices')}
          hint={t('auth.field.officesHint')}
          error={errors.offices?.message}
          className="sm:col-span-2"
        >
          <Textarea id="offices" rows={2} {...form.register('offices')} />
        </FormField>
        <FormField
          id="logo"
          label={t('auth.field.logo')}
          hint={logo.hint}
          error={logo.error ?? undefined}
          className="sm:col-span-2"
        >
          <div className="flex items-center gap-3">
            {logo.preview && (
              <img
                src={logo.preview}
                alt={t('auth.field.logoPreview')}
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
          {isSubmitting ? t('auth.register.submitting') : t('auth.register.submit')}
        </Button>
      </form>
    </AuthLayout>
  );
}
