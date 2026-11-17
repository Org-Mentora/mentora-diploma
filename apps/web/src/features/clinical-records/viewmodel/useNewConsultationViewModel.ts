import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import {
  type UseFieldArrayReturn,
  type UseFormReturn,
  useFieldArray,
  useForm,
} from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import {
  useGetPatientQuery,
  useRegisterConsultationMutation,
  useSearchDiagnosesQuery,
} from '@/model/api/generated/mentoraApi';
import {
  ClinicalRecordAdapter,
  type DiagnosisOption,
} from '@/model/domain/clinical-records/ClinicalRecordAdapter';
import {
  ConsultationForm,
  type ConsultationFormValues,
  consultationFormSchema,
  emptyMedication,
} from '@/model/domain/clinical-records/consultation.form';
import { useUserFeedback } from '@/model/platform/Platform';
import { useTranslation } from '@/shared/i18n';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';

export type { ConsultationFormValues };

export interface DiagnosisSearch {
  term: string;
  setTerm: (term: string) => void;
  options: DiagnosisOption[];
  hint: string;
  selected: { code: string; name: string } | null;
  select: (option: DiagnosisOption) => void;
  clear: () => void;
}

export interface NewConsultationViewModel {
  patientName: string;
  form: UseFormReturn<ConsultationFormValues>;
  medications: UseFieldArrayReturn<ConsultationFormValues, 'medications'>;
  addMedication: () => void;
  diagnosis: DiagnosisSearch;
  error: UiError | null;
  isSubmitting: boolean;
  submit: () => Promise<void>;
  cancel: () => void;
}

// ViewModel
export function useNewConsultationViewModel(): NewConsultationViewModel {
  const { t } = useTranslation();
  const feedback = useUserFeedback();
  const { patientId = '' } = useParams();
  const navigate = useNavigate();
  const { data: patient } = useGetPatientQuery({ id: patientId });
  const [registerConsultation, { isLoading }] = useRegisterConsultationMutation();
  const [error, setError] = useState<UiError | null>(null);

  const form = useForm<ConsultationFormValues>({
    resolver: zodResolver(consultationFormSchema),
    defaultValues: ConsultationForm.defaults(new Date()),
  });
  const medications = useFieldArray({ control: form.control, name: 'medications' });

  const [term, setTerm] = useState('');
  const debouncedTerm = useDebouncedValue(term.trim());
  const diagnoses = useSearchDiagnosesQuery(
    { q: debouncedTerm },
    { skip: debouncedTerm.length < 2 },
  );
  const options = useMemo(
    () => (diagnoses.data ?? []).map(ClinicalRecordAdapter.toDiagnosisOption),
    [diagnoses.data],
  );
  const selected = form.watch('diagnosis');

  const profilePath = `/patients/${patientId}`;

  const submit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await registerConsultation({
        patientId,
        registerConsultationRequestDto: ConsultationForm.toRequest(values),
      }).unwrap();
      feedback.success(t('clinical.added'));
      navigate(profilePath);
    } catch (caught) {
      setError(ApiErrorAdapter.toUiError(caught));
    }
  });

  return {
    patientName: patient?.fullName ?? '',
    form,
    medications,
    addMedication: () => medications.append(emptyMedication),
    diagnosis: {
      term,
      setTerm,
      options,
      hint:
        debouncedTerm.length < 2
          ? t('clinical.diagnosis.minChars')
          : options.length === 0 && !diagnoses.isFetching
            ? t('clinical.diagnosis.noMatch')
            : '',
      selected,
      select: (option) => {
        form.setValue('diagnosis', { code: option.code, name: option.name });
        setTerm('');
      },
      clear: () => form.setValue('diagnosis', null),
    },
    error,
    isSubmitting: isLoading,
    submit,
    cancel: () => navigate(profilePath),
  };
}
