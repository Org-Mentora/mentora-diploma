import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import {
  useCreatePatientMutation,
  useGetPatientQuery,
  useUpdatePatientMutation,
} from '@/model/api/generated/mentoraApi';
import {
  emptyPatientForm,
  PatientForm,
  type PatientFormValues,
  patientFormSchema,
} from '@/model/domain/patients/patient.form';

export interface PatientFormViewModel {
  form: UseFormReturn<PatientFormValues>;
  isEdit: boolean;
  isSubmitting: boolean;
  error: UiError | null;
  submit: () => Promise<void>;
}

interface Options {
  /** Edit this patient (CU-06); create a new one when absent (CU-04). */
  patientId?: string | undefined;
  onSaved: (patientId: string) => void;
}

export function usePatientFormViewModel({ patientId, onSaved }: Options): PatientFormViewModel {
  const isEdit = Boolean(patientId);
  const { data: patient } = useGetPatientQuery({ id: patientId ?? '' }, { skip: !patientId });
  const [createPatient, creating] = useCreatePatientMutation();
  const [updatePatient, updating] = useUpdatePatientMutation();
  const [error, setError] = useState<UiError | null>(null);
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: emptyPatientForm,
  });

  // CU-06 step 2: the edit form starts with the current data.
  useEffect(() => {
    if (patient) {
      form.reset(PatientForm.fromDto(patient));
    }
  }, [patient, form]);

  const submit = form.handleSubmit(async (values) => {
    setError(null);
    const patientInputDto = PatientForm.toInput(values);
    try {
      const saved =
        isEdit && patientId
          ? await updatePatient({ id: patientId, patientInputDto }).unwrap()
          : await createPatient({ patientInputDto }).unwrap();
      toast.success(isEdit ? 'Patient updated' : `${saved.fullName} was registered`);
      form.reset(emptyPatientForm);
      onSaved(saved.id);
    } catch (caught) {
      const uiError = ApiErrorAdapter.toUiError(caught);
      if (uiError?.field === 'dni') {
        form.setError('dni', { message: uiError.message });
      } else {
        setError(uiError);
      }
    }
  });

  return {
    form,
    isEdit,
    isSubmitting: creating.isLoading || updating.isLoading,
    error,
    submit,
  };
}
