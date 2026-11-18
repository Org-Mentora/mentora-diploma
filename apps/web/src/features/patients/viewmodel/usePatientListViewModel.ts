import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { UiError } from '@/model/api/ApiErrorAdapter';
import { useSearchPatientsQuery } from '@/model/api/generated/mentoraApi';
import { usePagedList } from '@/model/api/usePagedList';
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
  const list = usePagedList(
    useSearchPatientsQuery,
    term ? { q: term } : {},
    (dtos) => dtos.map(PatientAdapter.toListItem),
    { keepPreviousItems: true },
  );

  return {
    query,
    setQuery,
    patients: list.items,
    isLoading: list.isLoading,
    isSearching: list.isFetching && !list.isLoading && !list.isLoadingMore,
    hasMore: list.hasMore,
    isLoadingMore: list.isLoadingMore,
    loadMore: list.loadMore,
    error: list.error,
    emptyMessage: term ? t('patients.list.noMatch', { term }) : t('patients.list.empty'),
    isCreateOpen,
    setCreateOpen,
    openPatient: (patientId) => navigate(`/patients/${patientId}`),
  };
}
