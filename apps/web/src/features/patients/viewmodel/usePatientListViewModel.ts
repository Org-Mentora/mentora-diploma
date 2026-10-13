import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import { useSearchPatientsQuery } from '@/model/api/generated/mentoraApi';
import { PatientAdapter, type PatientListItem } from '@/model/domain/patients/PatientAdapter';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';

export interface PatientListViewModel {
  query: string;
  setQuery: (query: string) => void;
  patients: PatientListItem[];
  isLoading: boolean;
  isSearching: boolean;
  error: UiError | null;
  emptyMessage: string;
  isCreateOpen: boolean;
  setCreateOpen: (open: boolean) => void;
  openPatient: (patientId: string) => void;
}

/** CU-05 Search patients (+ entry point of CU-04). */
export function usePatientListViewModel(): PatientListViewModel {
  const [query, setQuery] = useState('');
  const [isCreateOpen, setCreateOpen] = useState(false);
  const term = useDebouncedValue(query.trim());
  const navigate = useNavigate();
  const { data, isLoading, isFetching, error } = useSearchPatientsQuery(term ? { q: term } : {});

  const patients = useMemo(() => (data ?? []).map(PatientAdapter.toListItem), [data]);

  return {
    query,
    setQuery,
    patients,
    isLoading,
    isSearching: isFetching && !isLoading,
    error: ApiErrorAdapter.toUiError(error),
    emptyMessage: term
      ? `No patients match "${term}".`
      : 'No patients registered yet. Add the first one.',
    isCreateOpen,
    setCreateOpen,
    openPatient: (patientId) => navigate(`/patients/${patientId}`),
  };
}
