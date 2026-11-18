import { Copy, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import { Button, buttonVariants } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { FormField } from '@/shared/ui/form-field';
import { Input } from '@/shared/ui/input';
import { NativeSelect } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { useBookingSettingsViewModel } from '../viewmodel/useBookingSettingsViewModel';

export function BookingSettingsPage() {
  const { t } = useTranslation();
  const vm = useBookingSettingsViewModel();
  const { errors, isDirty } = vm.form.formState;

  if (vm.isLoading) {
    return <p className="text-muted-foreground text-sm">{t('common.loading')}</p>;
  }

  return (
    <form className="grid max-w-3xl gap-6" noValidate onSubmit={vm.save}>
      <Card>
        <CardHeader>
          <CardTitle>{t('booking.settings.title')}</CardTitle>
          <CardDescription>{t('booking.settings.description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <label className="flex items-center gap-2 font-medium text-sm">
            <input type="checkbox" className="size-4" {...vm.form.register('enabled')} />
            {t('booking.settings.enabled')}
          </label>
          {vm.publicUrl && (
            <div className="grid gap-1.5">
              <span className="text-muted-foreground text-xs">{t('booking.settings.link')}</span>
              <div className="flex gap-2">
                <Input readOnly value={vm.publicUrl} aria-label={t('booking.settings.link')} />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={t('meetings.copyLink')}
                  onClick={() => void vm.copyLink()}
                >
                  <Copy />
                </Button>
                <a
                  href={vm.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('booking.settings.preview')}
                  className={buttonVariants({ variant: 'outline', size: 'icon' })}
                >
                  <ExternalLink />
                </a>
              </div>
              <span className="text-muted-foreground text-xs">
                {t('booking.settings.linkHint', { timezone: vm.timezone ?? '' })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('booking.settings.rulesTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <FormField
            id="slotMinutes"
            label={t('booking.settings.slotMinutes')}
            error={errors.slotMinutes?.message}
          >
            <Input
              id="slotMinutes"
              type="number"
              min={15}
              max={240}
              step={5}
              {...vm.form.register('slotMinutes')}
            />
          </FormField>
          <FormField
            id="minNoticeHours"
            label={t('booking.settings.minNotice')}
            error={errors.minNoticeHours?.message}
          >
            <Input
              id="minNoticeHours"
              type="number"
              min={0}
              max={168}
              {...vm.form.register('minNoticeHours')}
            />
          </FormField>
          <FormField
            id="horizonDays"
            label={t('booking.settings.horizon')}
            error={errors.horizonDays?.message}
          >
            <Input
              id="horizonDays"
              type="number"
              min={1}
              max={90}
              {...vm.form.register('horizonDays')}
            />
          </FormField>
          <fieldset className="grid gap-2 sm:col-span-3">
            <legend className="mb-2 font-medium text-sm">{t('booking.settings.modalities')}</legend>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="size-4" {...vm.form.register('inPerson')} />
                {t('agenda.modality.in_person')}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="size-4" {...vm.form.register('virtual')} />
                {t('agenda.modality.virtual')}
              </label>
            </div>
            {errors.inPerson?.message && (
              <p role="alert" className="text-destructive text-sm">
                {t(errors.inPerson.message)}
              </p>
            )}
          </fieldset>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-1.5">
            <CardTitle>{t('booking.settings.hoursTitle')}</CardTitle>
            <CardDescription>{t('booking.settings.hoursDescription')}</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={vm.addWindow}>
            <Plus /> {t('booking.settings.addRange')}
          </Button>
        </CardHeader>
        <CardContent className="@container grid gap-3">
          {vm.windows.fields.length === 0 && (
            <p className="text-muted-foreground text-sm">{t('booking.settings.noHours')}</p>
          )}
          {vm.windows.fields.map((field, index) => {
            const rowErrors = errors.weeklyHours?.[index];
            return (
              <div
                key={field.id}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-2 border-b pb-3 last:border-b-0 @lg:grid-cols-[minmax(0,12rem)_8rem_8rem_auto] @lg:border-b-0 @lg:pb-0"
              >
                <NativeSelect
                  aria-label={t('booking.settings.weekday')}
                  className="col-span-2 @lg:col-span-1"
                  {...vm.form.register(`weeklyHours.${index}.weekday`)}
                >
                  {vm.weekdays.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </NativeSelect>
                <FormField id={`weeklyHours.${index}.start`} error={rowErrors?.start?.message}>
                  <Input
                    id={`weeklyHours.${index}.start`}
                    type="time"
                    aria-label={t('booking.settings.from')}
                    {...vm.form.register(`weeklyHours.${index}.start`)}
                  />
                </FormField>
                <FormField id={`weeklyHours.${index}.end`} error={rowErrors?.end?.message}>
                  <Input
                    id={`weeklyHours.${index}.end`}
                    type="time"
                    aria-label={t('booking.settings.to')}
                    {...vm.form.register(`weeklyHours.${index}.end`)}
                  />
                </FormField>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="col-start-3 row-start-1 @lg:col-start-auto @lg:row-start-auto"
                  aria-label={t('booking.settings.removeRange')}
                  onClick={() => vm.windows.remove(index)}
                >
                  <Trash2 />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <FormField
            id="instructions"
            label={t('booking.settings.instructions')}
            hint={t('booking.settings.instructionsHint')}
            error={errors.instructions?.message}
          >
            <Textarea id="instructions" rows={3} {...vm.form.register('instructions')} />
          </FormField>
        </CardContent>
      </Card>

      {(errors.root || vm.error) && (
        <p role="alert" className="text-destructive text-sm">
          {errors.root?.message ?? vm.error?.message}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={vm.discard} disabled={!isDirty}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={vm.isSaving}>
          {vm.isSaving ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </form>
  );
}
