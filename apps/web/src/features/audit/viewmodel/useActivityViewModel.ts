import { useMemo, useState } from 'react';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import { useListAuditEventsQuery } from '@/model/api/generated/mentoraApi';
import { usePagedQuery } from '@/model/api/usePagedQuery';
import { AUDIT_CATEGORIES, AuditAdapter, type AuditItem } from '@/model/domain/audit/AuditAdapter';
import { useTranslation } from '@/shared/i18n';

export type { AuditItem };

export interface ActivityViewModel {
  items: AuditItem[];
  categories: { value: string; label: string }[];
  category: string;
  setCategory: (category: string) => void;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  error: UiError | null;
}

const PAGE_SIZE = 20;

// ViewModel
export function useActivityViewModel(): ActivityViewModel {
  const { t } = useTranslation();
  const [category, setCategory] = useState('');
  const list = usePagedQuery(
    useListAuditEventsQuery,
    category ? { limit: PAGE_SIZE, category } : { limit: PAGE_SIZE },
  );
  const items = useMemo(() => list.items.map(AuditAdapter.toItem), [list.items]);

  return {
    items,
    categories: [
      { value: '', label: t('audit.allCategories') },
      ...AUDIT_CATEGORIES.map((value) => ({ value, label: AuditAdapter.categoryLabel(value) })),
    ],
    category,
    setCategory,
    isLoading: list.isLoading,
    isLoadingMore: list.isLoadingMore,
    hasMore: list.hasMore,
    loadMore: list.loadMore,
    refresh: list.refresh,
    error: ApiErrorAdapter.toUiError(list.error),
  };
}
