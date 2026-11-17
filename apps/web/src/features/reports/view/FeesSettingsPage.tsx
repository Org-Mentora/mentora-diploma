import { useTranslation } from '@/shared/i18n';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { FormField } from '@/shared/ui/form-field';
import { Input } from '@/shared/ui/input';
import { useFeesViewModel } from '../viewmodel/useFeesViewModel';

export function FeesSettingsPage() {
  const { t } = useTranslation();
  const vm = useFeesViewModel();
  const { errors, isDirty } = vm.form.formState;

  if (vm.isLoading) {
    return <p className="text-muted-foreground text-sm">{t('common.loading')}</p>;
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{t('fees.title')}</CardTitle>
        <CardDescription>{t('fees.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" noValidate onSubmit={vm.save}>
          {vm.rows.map((row) => (
            <FormField
              key={row.name}
              id={`fee-${row.name}`}
              label={`${row.label} (${vm.currency})`}
              error={errors[row.name]?.message}
            >
              <Input
                id={`fee-${row.name}`}
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                placeholder={t('fees.notSet')}
                {...vm.form.register(row.name)}
              />
            </FormField>
          ))}
          <p className="text-muted-foreground text-xs sm:col-span-2">{t('fees.hint')}</p>
          {(errors.root || vm.error) && (
            <p role="alert" className="text-destructive text-sm sm:col-span-2">
              {errors.root?.message ?? vm.error?.message}
            </p>
          )}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={vm.discard} disabled={!isDirty}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={vm.isSaving}>
              {vm.isSaving ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
