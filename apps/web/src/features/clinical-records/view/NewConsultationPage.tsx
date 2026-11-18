import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { FormField } from '@/shared/ui/form-field';
import { Input } from '@/shared/ui/input';
import { NativeSelect } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { useNewConsultationViewModel } from '../viewmodel/useNewConsultationViewModel';
import { DiagnosisPicker } from './DiagnosisPicker';
import { MedicationFields } from './MedicationFields';

export function NewConsultationPage() {
  const { t } = useTranslation();
  const vm = useNewConsultationViewModel();
  const { errors } = vm.form.formState;

  return (
    <div className="grid grid-cols-1 gap-4">
      <button
        type="button"
        onClick={vm.cancel}
        className="flex w-fit items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {t('clinical.backToPatient')}
      </button>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('patients.profile.newConsultation')}</CardTitle>
          <CardDescription>{vm.patientName}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6" noValidate onSubmit={vm.submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="date"
                label={t('clinical.field.dateTime')}
                error={errors.date?.message}
              >
                <Input id="date" type="datetime-local" {...vm.form.register('date')} />
              </FormField>
              <FormField id="type" label={t('clinical.field.type')}>
                <NativeSelect id="type" {...vm.form.register('type')}>
                  <option value="in_person">{t('agenda.modality.in_person')}</option>
                  <option value="virtual">{t('agenda.modality.virtual')}</option>
                </NativeSelect>
              </FormField>
              <FormField
                id="reason"
                label={t('clinical.field.reason')}
                className="sm:col-span-2"
                error={errors.reason?.message}
              >
                <Input id="reason" aria-invalid={!!errors.reason} {...vm.form.register('reason')} />
              </FormField>
              <FormField
                id="evolution"
                label={t('clinical.field.evolution')}
                className="sm:col-span-2"
              >
                <Textarea id="evolution" rows={5} {...vm.form.register('evolution')} />
              </FormField>
              <FormField
                id="observations"
                label={t('patients.profile.observations')}
                className="sm:col-span-2"
              >
                <Textarea id="observations" {...vm.form.register('observations')} />
              </FormField>
            </div>

            <DiagnosisPicker search={vm.diagnosis} />

            <MedicationFields
              form={vm.form}
              medications={vm.medications}
              onAdd={vm.addMedication}
            />

            {vm.error && (
              <p role="alert" className="text-destructive text-sm">
                {vm.error.message}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={vm.cancel}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={vm.isSubmitting}>
                {vm.isSubmitting ? t('common.saving') : t('clinical.save')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
