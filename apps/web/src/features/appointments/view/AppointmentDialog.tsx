import { VirtualMeetingButton } from '@/features/virtual-consultations';
import { useTranslation } from '@/shared/i18n';
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

export function AppointmentDialog({ appointmentId, day, onClose }: AppointmentDialogProps) {
  const { t } = useTranslation();
  const vm = useAppointmentFormViewModel({ appointmentId, day, onDone: onClose });
  const { errors } = vm.form.formState;
  const readOnly = vm.isCancelled;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{vm.isEdit ? t('agenda.appointment') : t('agenda.new')}</DialogTitle>
          <DialogDescription>
            {vm.isEdit
              ? `${vm.patientName}${readOnly ? ` · ${t('agenda.cancelledLower')}` : ''}`
              : t('agenda.slotFree')}
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
              <FormField
                id="patient-search"
                label={t('agenda.findPatient')}
                className="sm:col-span-2"
              >
                <Input
                  id="patient-search"
                  placeholder={t('agenda.findPlaceholder')}
                  value={vm.patientSearch}
                  onChange={(event) => vm.setPatientSearch(event.target.value)}
                />
              </FormField>
              <FormField
                id="patientId"
                label={t('agenda.patient')}
                className="sm:col-span-2"
                error={errors.patientId?.message}
              >
                <NativeSelect id="patientId" {...vm.form.register('patientId')}>
                  <option value="">{t('agenda.selectPatient')}</option>
                  {vm.patientOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
            </>
          )}
          <FormField id="date" label={t('agenda.date')} error={errors.date?.message}>
            <Input id="date" type="date" disabled={readOnly} {...vm.form.register('date')} />
          </FormField>
          <FormField id="time" label={t('agenda.time')} error={errors.time?.message}>
            <Input id="time" type="time" disabled={readOnly} {...vm.form.register('time')} />
          </FormField>
          <FormField
            id="durationMinutes"
            label={t('agenda.duration')}
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
          <FormField id="type" label={t('agenda.consultationType')}>
            <NativeSelect id="type" disabled={readOnly} {...vm.form.register('type')}>
              {vm.typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField id="modality" label={t('agenda.modalityLabel')}>
            <NativeSelect id="modality" disabled={readOnly} {...vm.form.register('modality')}>
              {vm.modalityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField
            id="fee"
            label={t('agenda.fee')}
            hint={t('agenda.feeHint')}
            className="sm:col-span-2"
            error={errors.fee?.message}
          >
            <Input
              id="fee"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              disabled={readOnly}
              {...vm.form.register('fee')}
            />
          </FormField>
          <FormField id="notes" label={t('agenda.notes')} className="sm:col-span-2">
            <Textarea id="notes" disabled={readOnly} {...vm.form.register('notes')} />
          </FormField>
        </form>

        {vm.virtualMeeting && (
          <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/40 p-3 text-sm">
            <span className="text-muted-foreground">{t('agenda.virtualAppointment')}</span>
            <VirtualMeetingButton
              patientId={vm.virtualMeeting.patientId}
              appointmentId={vm.virtualMeeting.appointmentId}
            />
          </div>
        )}

        {vm.error && (
          <p role="alert" className="text-destructive text-sm">
            {vm.error.message}
          </p>
        )}

        {vm.isConfirmingCancel ? (
          <DialogFooter className="items-center">
            <p className="mr-auto text-sm">{t('agenda.cancelConfirm')}</p>
            <Button variant="outline" onClick={vm.abortCancel}>
              {t('agenda.keep')}
            </Button>
            <Button onClick={() => void vm.confirmCancel()} disabled={vm.isSubmitting}>
              {t('agenda.yesCancel')}
            </Button>
          </DialogFooter>
        ) : (
          <DialogFooter>
            {vm.isEdit && !readOnly && (
              <Button variant="ghost" className="sm:mr-auto" onClick={vm.requestCancel}>
                {t('agenda.cancelAppointment')}
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              {t('common.close')}
            </Button>
            {!readOnly && (
              <Button type="submit" form="appointment-form" disabled={vm.isSubmitting}>
                {vm.isEdit ? t('agenda.saveChanges') : t('agenda.schedule')}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
