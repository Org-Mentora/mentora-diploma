import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import { useSearchPatientsQuery } from '@/model/api/generated/mentoraApi';
import { usePagedQuery } from '@/model/api/usePagedQuery';
import { PatientAdapter, type PatientListItem } from '@/model/domain/patients/PatientAdapter';
import { useTranslation } from '@/shared/i18n';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';

export interface PatientListViewModel {
  query: string;
  setQuery: (query: string) => void;
  patients: PatientListItem[];
  isLoading: boolean;
  isSearching: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  error: UiError | null;
  emptyMessage: string;
  isCreateOpen: boolean;
  setCreateOpen: (open: boolean) => void;
  openPatient: (patientId: string) => void;
}

// ViewModel
export function usePatientListViewModel(): PatientListViewModel {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isCreateOpen, setCreateOpen] = useState(false);
  const term = useDebouncedValue(query.trim());
  const navigate = useNavigate();
  const list = usePagedQuery(useSearchPatientsQuery, term ? { q: term } : {}, {
    keepPreviousItems: true,
  });

  const patients = useMemo(() => list.items.map(PatientAdapter.toListItem), [list.items]);

  return {
    query,
    setQuery,
    patients,
    isLoading: list.isLoading,
    isSearching: list.isFetching && !list.isLoading && !list.isLoadingMore,
    hasMore: list.hasMore,
    isLoadingMore: list.isLoadingMore,
    loadMore: list.loadMore,
    error: ApiErrorAdapter.toUiError(list.error),
    emptyMessage: term ? t('patients.list.noMatch', { term }) : t('patients.list.empty'),
    isCreateOpen,
    setCreateOpen,
    openPatient: (patientId) => navigate(`/patients/${patientId}`),
  };
}
