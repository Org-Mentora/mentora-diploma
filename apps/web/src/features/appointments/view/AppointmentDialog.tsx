import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { FormField } from '@/shared/ui/form-field';
import { Input } from '@/shared/ui/input';
import { NativeSelect } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { useAppointmentFormViewModel } from '../viewmodel/useAppointmentFormViewModel';

interface AppointmentDialogProps {
  appointmentId?: string | undefined;
  day: Date;
  onClose: () => void;
}

/** CU-10: create (step 7), modify (step 9) or cancel (step 10) an appointment. */
export function AppointmentDialog({ appointmentId, day, onClose }: AppointmentDialogProps) {
  const vm = useAppointmentFormViewModel({ appointmentId, day, onDone: onClose });
  const { errors } = vm.form.formState;
  const readOnly = vm.isCancelled;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{vm.isEdit ? 'Appointment' : 'New appointment'}</DialogTitle>
          <DialogDescription>
            {vm.isEdit
              ? `${vm.patientName}${readOnly ? ' · cancelled' : ''}`
              : 'The time slot must be free.'}
          </DialogDescription>
        </DialogHeader>

        <form
          id="appointment-form"
          className="grid gap-4 sm:grid-cols-2"
          noValidate
          onSubmit={vm.submit}
        >
          {!vm.isEdit && (
            <>
              <FormField id="patient-search" label="Find patient" className="sm:col-span-2">
                <Input
                  id="patient-search"
                  placeholder="Name, surname or DNI"
                  value={vm.patientSearch}
                  onChange={(event) => vm.setPatientSearch(event.target.value)}
                />
              </FormField>
              <FormField
                id="patientId"
                label="Patient"
                className="sm:col-span-2"
                error={errors.patientId?.message}
              >
                <NativeSelect id="patientId" {...vm.form.register('patientId')}>
                  <option value="">Select a patient…</option>
                  {vm.patientOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
            </>
          )}
          <FormField id="date" label="Date" error={errors.date?.message}>
            <Input id="date" type="date" disabled={readOnly} {...vm.form.register('date')} />
          </FormField>
          <FormField id="time" label="Time" error={errors.time?.message}>
            <Input id="time" type="time" disabled={readOnly} {...vm.form.register('time')} />
          </FormField>
          <FormField
            id="durationMinutes"
            label="Duration (minutes)"
            error={errors.durationMinutes?.message}
          >
            <Input
              id="durationMinutes"
              type="number"
              min={10}
              max={240}
              step={5}
              disabled={readOnly}
              {...vm.form.register('durationMinutes')}
            />
          </FormField>
          <FormField id="type" label="Consultation type">
            <NativeSelect id="type" disabled={readOnly} {...vm.form.register('type')}>
              {vm.typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField id="modality" label="Modality">
            <NativeSelect id="modality" disabled={readOnly} {...vm.form.register('modality')}>
              {vm.modalityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField id="notes" label="Notes" className="sm:col-span-2">
            <Textarea id="notes" disabled={readOnly} {...vm.form.register('notes')} />
          </FormField>
        </form>

        {vm.error && (
          <p role="alert" className="text-destructive text-sm">
            {vm.error.message}
          </p>
        )}

        {vm.isConfirmingCancel ? (
          <DialogFooter className="items-center">
            <p className="mr-auto text-sm">Cancel this appointment?</p>
            <Button variant="outline" onClick={vm.abortCancel}>
              Keep it
            </Button>
            <Button onClick={() => void vm.confirmCancel()} disabled={vm.isSubmitting}>
              Yes, cancel
            </Button>
          </DialogFooter>
        ) : (
          <DialogFooter>
            {vm.isEdit && !readOnly && (
              <Button variant="ghost" className="sm:mr-auto" onClick={vm.requestCancel}>
                Cancel appointment
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {!readOnly && (
              <Button type="submit" form="appointment-form" disabled={vm.isSubmitting}>
                {vm.isEdit ? 'Save changes' : 'Schedule'}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
