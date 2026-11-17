import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
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
import { useUserFeedback } from '@/model/platform/Platform';
import { useTranslation } from '@/shared/i18n';

export interface PatientFormViewModel {
  form: UseFormReturn<PatientFormValues>;
  isEdit: boolean;
  isSubmitting: boolean;
  error: UiError | null;
  submit: () => Promise<void>;
}

interface Options {
  patientId?: string | undefined;
  onSaved: (patientId: string) => void;
}

// ViewModel
export function usePatientFormViewModel({ patientId, onSaved }: Options): PatientFormViewModel {
  const { t } = useTranslation();
  const feedback = useUserFeedback();
  const isEdit = Boolean(patientId);
  const { data: patient } = useGetPatientQuery({ id: patientId ?? '' }, { skip: !patientId });
  const [createPatient, creating] = useCreatePatientMutation();
  const [updatePatient, updating] = useUpdatePatientMutation();
  const [error, setError] = useState<UiError | null>(null);
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: emptyPatientForm,
  });

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
      feedback.success(
        isEdit
          ? t('patients.form.updated')
          : t('patients.form.registered', { name: saved.fullName }),
      );
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
