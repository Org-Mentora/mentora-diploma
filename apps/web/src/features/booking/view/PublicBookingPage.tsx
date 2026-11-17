import { CalendarCheck, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { LanguageSwitcher } from '@/features/preferences';
import { useTranslation } from '@/shared/i18n';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';
import { FormField } from '@/shared/ui/form-field';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { usePublicBookingViewModel } from '../viewmodel/usePublicBookingViewModel';

const FIELDS = [
  { name: 'firstName', label: 'auth.field.firstName', autoComplete: 'given-name' },
  { name: 'lastName', label: 'auth.field.lastName', autoComplete: 'family-name' },
  { name: 'dni', label: 'booking.public.dni', autoComplete: 'off', inputMode: 'numeric' },
  { name: 'birthDate', label: 'patients.field.birthDate', autoComplete: 'bday', type: 'date' },
  { name: 'phone', label: 'booking.public.phone', autoComplete: 'tel', type: 'tel' },
  { name: 'email', label: 'auth.field.email', autoComplete: 'email', type: 'email' },
] as const;

export function PublicBookingPage() {
  const { t } = useTranslation();
  const vm = usePublicBookingViewModel();
  const { errors } = vm.form.formState;

  return (
    <div className="min-h-dvh bg-muted/30 px-4 py-8">
      <div className="mx-auto grid max-w-3xl gap-6">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-xl tracking-tight">Mentora</p>
          <LanguageSwitcher />
        </div>

        {vm.isLoading ? (
          <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
        ) : vm.notFound || !vm.page ? (
          <EmptyState
            title={t('booking.public.notFoundTitle')}
            description={t('booking.public.notFoundDescription')}
          />
        ) : vm.receipt ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="size-5 text-emerald-600" />
                {t('booking.public.sentTitle')}
              </CardTitle>
              <CardDescription>
                {t('booking.public.sentDescription', { name: vm.page.professionalName })}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <p className="font-medium">
                {vm.receipt.when} · {vm.receipt.modality}
              </p>
              <Button variant="outline" className="w-fit" onClick={vm.startOver}>
                {t('booking.public.another')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{vm.page.professionalName}</CardTitle>
                <CardDescription>{vm.page.specialty}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-4" /> {vm.page.durationLabel} ·{' '}
                  {vm.page.modalities.map((m) => m.label).join(' / ')}
                </p>
                {vm.page.offices.map((office) => (
                  <p key={office} className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="size-4" /> {office}
                  </p>
                ))}
                {vm.page.instructions && (
                  <p className="whitespace-pre-wrap rounded-md bg-muted/50 p-3">
                    {vm.page.instructions}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                <div className="grid gap-1.5">
                  <CardTitle>{t('booking.public.chooseTime')}</CardTitle>
                  <CardDescription>{vm.page.timezoneNote}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('booking.public.previousWeek')}
                    onClick={vm.previousWeek}
                    disabled={!vm.canGoBack}
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('booking.public.nextWeek')}
                    onClick={vm.nextWeek}
                    disabled={!vm.canGoForward}
                  >
                    <ChevronRight />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4" aria-busy={vm.isLoadingSlots}>
                {vm.slotsError && (
                  <p role="alert" className="text-destructive text-sm">
                    {vm.slotsError.message}
                  </p>
                )}
                {vm.days.every((day) => day.slots.length === 0) && !vm.isLoadingSlots ? (
                  <p className="text-muted-foreground text-sm">{t('booking.public.noSlots')}</p>
                ) : (
                  vm.days
                    .filter((day) => day.slots.length > 0)
                    .map((day) => (
                      <div key={day.date} className="grid gap-2">
                        <h3 className="font-medium text-sm first-letter:uppercase">{day.label}</h3>
                        <div className="flex flex-wrap gap-2">
                          {day.slots.map((slot) => (
                            <Button
                              key={slot.startsAt}
                              size="sm"
                              variant={
                                vm.selected?.startsAt === slot.startsAt ? 'default' : 'outline'
                              }
                              aria-pressed={vm.selected?.startsAt === slot.startsAt}
                              className="tabular-nums"
                              onClick={() => vm.selectSlot(slot)}
                            >
                              {slot.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>

            {vm.selected && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('booking.public.yourData')}</CardTitle>
                  <CardDescription>{t('booking.public.yourDataDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-4 sm:grid-cols-2" noValidate onSubmit={vm.submit}>
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
                          autoComplete={field.autoComplete}
                          {...('inputMode' in field ? { inputMode: field.inputMode } : {})}
                          aria-invalid={!!errors[field.name]}
                          {...vm.form.register(field.name)}
                        />
                      </FormField>
                    ))}
                    {vm.page.modalities.length > 1 && (
                      <fieldset className="grid gap-2 sm:col-span-2">
                        <legend className="mb-2 font-medium text-sm">
                          {t('agenda.modalityLabel')}
                        </legend>
                        <div className="flex gap-4 text-sm">
                          {vm.page.modalities.map((modality) => (
                            <label key={modality.value} className="flex items-center gap-2">
                              <input
                                type="radio"
                                value={modality.value}
                                {...vm.form.register('modality')}
                              />
                              {modality.label}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    )}
                    <FormField
                      id="reason"
                      label={t('booking.public.reason')}
                      className="sm:col-span-2"
                      error={errors.reason?.message}
                    >
                      <Textarea id="reason" rows={3} {...vm.form.register('reason')} />
                    </FormField>
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden
                      className="absolute left-[-9999px] h-0 w-0 opacity-0"
                      {...vm.form.register('website')}
                    />
                    {vm.submitError && (
                      <p role="alert" className="text-destructive text-sm sm:col-span-2">
                        {vm.submitError.message}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2">
                      <span className="text-sm">
                        {t('booking.public.selected', { time: vm.selected.fullLabel })}
                      </span>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={vm.clearSlot}>
                          {t('booking.public.changeTime')}
                        </Button>
                        <Button type="submit" disabled={vm.isSubmitting}>
                          {vm.isSubmitting ? t('common.saving') : t('booking.public.submit')}
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
