import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { FormField } from '@/shared/ui/form-field';
import { Input } from '@/shared/ui/input';
import { NativeSelect } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { useNewConsultationViewModel } from '../viewmodel/useNewConsultationViewModel';
import { DiagnosisPicker } from './DiagnosisPicker';
import { MedicationFields } from './MedicationFields';

/** CU-09 Register consultation (+ CU-11 diagnosis, CU-12 medication). */
export function NewConsultationPage() {
  const vm = useNewConsultationViewModel();
  const { errors } = vm.form.formState;

  return (
    <div className="grid gap-4">
      <button
        type="button"
        onClick={vm.cancel}
        className="flex w-fit items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to the patient
      </button>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">New consultation</CardTitle>
          <CardDescription>{vm.patientName}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6" noValidate onSubmit={vm.submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="date" label="Date and time" error={errors.date?.message}>
                <Input id="date" type="datetime-local" {...vm.form.register('date')} />
              </FormField>
              <FormField id="type" label="Type">
                <NativeSelect id="type" {...vm.form.register('type')}>
                  <option value="in_person">In person</option>
                  <option value="virtual">Virtual</option>
                </NativeSelect>
              </FormField>
              <FormField
                id="reason"
                label="Reason for consultation"
                className="sm:col-span-2"
                error={errors.reason?.message}
              >
                <Input id="reason" aria-invalid={!!errors.reason} {...vm.form.register('reason')} />
              </FormField>
              <FormField id="evolution" label="Evolution" className="sm:col-span-2">
                <Textarea id="evolution" rows={5} {...vm.form.register('evolution')} />
              </FormField>
              <FormField id="observations" label="Observations" className="sm:col-span-2">
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
                Cancel
              </Button>
              <Button type="submit" disabled={vm.isSubmitting}>
                {vm.isSubmitting ? 'Saving…' : 'Save consultation'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
