import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import {
  type UseFieldArrayReturn,
  type UseFormReturn,
  useFieldArray,
  useForm,
} from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
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
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';

/** Re-exported so views can type form props without importing the Model. */
export type { ConsultationFormValues };

export interface DiagnosisSearch {
  term: string;
  setTerm: (term: string) => void;
  options: DiagnosisOption[];
  isSearching: boolean;
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

/** CU-09 Register consultation, with CU-11 (DSM-5 diagnosis) and CU-12 (medication). */
export function useNewConsultationViewModel(): NewConsultationViewModel {
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

  // CU-11 steps 3-4: filter the catalog while the professional types.
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
      toast.success('Consultation added to the clinical record');
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
      isSearching: diagnoses.isFetching,
      hint:
        debouncedTerm.length < 2
          ? 'Type at least 2 characters of a name or code (e.g. "anxiety", "F41")'
          : options.length === 0 && !diagnoses.isFetching
            ? 'No diagnoses match. Try another term.'
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
