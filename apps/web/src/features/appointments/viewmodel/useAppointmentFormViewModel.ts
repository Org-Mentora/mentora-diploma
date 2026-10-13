import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import {
  useCancelAppointmentMutation,
  useGetAppointmentQuery,
  useRescheduleAppointmentMutation,
  useScheduleAppointmentMutation,
  useSearchPatientsQuery,
} from '@/model/api/generated/mentoraApi';
import { APPOINTMENT_TYPE_LABEL, MODALITY_LABEL } from '@/model/domain/appointments/AgendaAdapter';
import {
  AppointmentForm,
  type AppointmentFormValues,
  appointmentFormSchema,
} from '@/model/domain/appointments/appointment.form';
import { PatientAdapter } from '@/model/domain/patients/PatientAdapter';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';

export type { AppointmentFormValues };

export interface Option {
  value: string;
  label: string;
}

export interface AppointmentFormViewModel {
  form: UseFormReturn<AppointmentFormValues>;
  isEdit: boolean;
  isCancelled: boolean;
  patientName: string;
  patientSearch: string;
  setPatientSearch: (term: string) => void;
  patientOptions: Option[];
  typeOptions: Option[];
  modalityOptions: Option[];
  error: UiError | null;
  isSubmitting: boolean;
  submit: () => Promise<void>;
  isConfirmingCancel: boolean;
  requestCancel: () => void;
  abortCancel: () => void;
  confirmCancel: () => Promise<void>;
}

interface Options {
  appointmentId?: string | undefined;
  day: Date;
  onDone: () => void;
}

const toOptions = (labels: Record<string, string>): Option[] =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

/** CU-10 steps 7, 9 and 10: create, modify or cancel one appointment. */
export function useAppointmentFormViewModel({
  appointmentId,
  day,
  onDone,
}: Options): AppointmentFormViewModel {
  const isEdit = Boolean(appointmentId);
  const { data: appointment } = useGetAppointmentQuery(
    { id: appointmentId ?? '' },
    { skip: !appointmentId },
  );
  const [schedule, scheduling] = useScheduleAppointmentMutation();
  const [reschedule, rescheduling] = useRescheduleAppointmentMutation();
  const [cancel, cancelling] = useCancelAppointmentMutation();
  const [error, setError] = useState<UiError | null>(null);
  const [isConfirmingCancel, setConfirmingCancel] = useState(false);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: AppointmentForm.defaults(day),
  });

  useEffect(() => {
    if (appointment) {
      form.reset(AppointmentForm.fromDto(appointment));
    }
  }, [appointment, form]);

  // Patient picker (create only): the agenda only accepts registered patients.
  const [patientSearch, setPatientSearch] = useState('');
  const term = useDebouncedValue(patientSearch.trim());
  const { data: patients } = useSearchPatientsQuery(term ? { q: term } : {}, { skip: isEdit });
  const patientOptions = useMemo(
    () =>
      (patients ?? [])
        .filter((p) => p.status !== 'discharged')
        .map((p) => ({
          value: p.id,
          label: `${p.fullName} · DNI ${PatientAdapter.formatDni(p.dni)}`,
        })),
    [patients],
  );

  const fail = (caught: unknown) => {
    const uiError = ApiErrorAdapter.toUiError(caught);
    if (uiError?.status === 409 && uiError.field === 'startsAt') {
      form.setError('time', { message: uiError.message });
    } else {
      setError(uiError);
    }
  };

  const submit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      if (isEdit && appointmentId) {
        await reschedule({
          id: appointmentId,
          rescheduleAppointmentRequestDto: AppointmentForm.toReschedule(values),
        }).unwrap();
        toast.success('Appointment updated. The patient will be notified.');
      } else {
        await schedule({
          scheduleAppointmentRequestDto: AppointmentForm.toSchedule(values),
        }).unwrap();
        toast.success('Appointment scheduled. The patient will be notified.');
      }
      onDone();
    } catch (caught) {
      fail(caught);
    }
  });

  return {
    form,
    isEdit,
    isCancelled: appointment?.status === 'cancelled',
    patientName: appointment?.patientName ?? '',
    patientSearch,
    setPatientSearch,
    patientOptions,
    typeOptions: toOptions(APPOINTMENT_TYPE_LABEL),
    modalityOptions: toOptions(MODALITY_LABEL),
    error,
    isSubmitting: scheduling.isLoading || rescheduling.isLoading || cancelling.isLoading,
    submit,
    isConfirmingCancel,
    requestCancel: () => setConfirmingCancel(true),
    abortCancel: () => setConfirmingCancel(false),
    confirmCancel: async () => {
      if (!appointmentId) {
        return;
      }
      try {
        await cancel({ id: appointmentId }).unwrap();
        toast.success('Appointment cancelled. The patient will be notified.');
        onDone();
      } catch (caught) {
        fail(caught);
      } finally {
        setConfirmingCancel(false);
      }
    },
  };
}
