import { useTranslation } from '@/shared/i18n';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { FormField } from '@/shared/ui/form-field';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { useProfileSettingsViewModel } from '../viewmodel/useProfileSettingsViewModel';

const FIELDS = [
  { name: 'firstName', label: 'auth.field.firstName' },
  { name: 'lastName', label: 'auth.field.lastName' },
  { name: 'specialty', label: 'auth.field.specialty' },
  { name: 'licenseNumber', label: 'auth.field.licenseNumber' },
  { name: 'email', label: 'auth.field.email', type: 'email' },
  { name: 'phone', label: 'auth.field.phone', type: 'tel' },
] as const;

export function ProfileSettingsPage() {
  const { t } = useTranslation();
  const vm = useProfileSettingsViewModel();
  const { errors, isDirty } = vm.form.formState;

  if (vm.isLoading) {
    return <p className="text-muted-foreground text-sm">{t('settings.profile.loading')}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.section.profile')}</CardTitle>
          <CardDescription>{t('settings.profile.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" noValidate onSubmit={vm.save}>
            {FIELDS.map((field) => (
              <FormField
                key={field.name}
                id={field.name}
                label={t(field.label)}
                error={errors[field.name]?.message}
              >
                <Input
                  id={field.name}
                  type={'type' in field ? field.type : 'text'}
                  aria-invalid={!!errors[field.name]}
                  {...vm.form.register(field.name)}
                />
              </FormField>
            ))}
            <FormField
              id="offices"
              label={t('settings.profile.offices')}
              hint={t('settings.profile.officesHint')}
              error={errors.offices?.message}
              className="sm:col-span-2"
            >
              <Textarea id="offices" rows={3} {...vm.form.register('offices')} />
            </FormField>
            {errors.root && (
              <p role="alert" className="text-destructive text-sm sm:col-span-2">
                {errors.root.message}
              </p>
            )}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="outline" onClick={vm.discard} disabled={!isDirty}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={vm.isSaving}>
                {t('common.save')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('prescription.logo')}</CardTitle>
          <CardDescription>{t('settings.profile.logoDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <div className="flex size-20 items-center justify-center rounded-md border bg-muted/40">
            {vm.logo.url ? (
              <img
                src={vm.logo.url}
                alt={t('settings.profile.yourLogo')}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-muted-foreground text-xs">
                {t('settings.profile.defaultLogo')}
              </span>
            )}
          </div>
          <div className="grid gap-2">
            <FormField
              id="logo"
              label={t('settings.profile.uploadLogo')}
              hint={vm.logo.hint}
              error={vm.logo.error ?? undefined}
            >
              <Input
                id="logo"
                type="file"
                accept={vm.logo.accept}
                disabled={vm.logo.isSaving}
                onChange={(event) => {
                  void vm.uploadLogo(event.target.files?.[0] ?? null);
                  event.target.value = '';
                }}
              />
            </FormField>
            {vm.logo.url && (
              <Button
                variant="ghost"
                className="w-fit"
                onClick={() => void vm.removeLogo()}
                disabled={vm.logo.isSaving}
              >
                {t('settings.profile.removeLogo')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
