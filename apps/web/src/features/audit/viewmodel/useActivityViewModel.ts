import { useEffect, useMemo, useState } from 'react';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import { useListAuditEventsQuery } from '@/model/api/generated/mentoraApi';
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

const PAGE_SIZE = 30;

// ViewModel
export function useActivityViewModel(): ActivityViewModel {
  const { t } = useTranslation();
  const [category, setCategory] = useState('');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [pages, setPages] = useState<AuditItem[][]>([]);
  const { data, isFetching, isLoading, error, refetch } = useListAuditEventsQuery(
    {
      limit: PAGE_SIZE,
      ...(category ? { category } : {}),
      ...(cursor ? { before: cursor } : {}),
    },
    { refetchOnMountOrArgChange: true },
  );

  useEffect(() => {
    if (!data) {
      return;
    }
    const page = data.items.map(AuditAdapter.toItem);
    setPages((previous) => (cursor ? [...previous, page] : [page]));
  }, [data, cursor]);

  const items = useMemo(() => pages.flat(), [pages]);

  return {
    items,
    categories: [
      { value: '', label: t('audit.allCategories') },
      ...AUDIT_CATEGORIES.map((value) => ({ value, label: AuditAdapter.categoryLabel(value) })),
    ],
    category,
    setCategory: (next) => {
      setCategory(next);
      setCursor(undefined);
      setPages([]);
    },
    isLoading: isLoading || (isFetching && !cursor && pages.length === 0),
    isLoadingMore: isFetching && cursor !== undefined,
    hasMore: Boolean(data?.nextBefore),
    loadMore: () => {
      if (data?.nextBefore) {
        setCursor(data.nextBefore);
      }
    },
    refresh: () => {
      if (cursor) {
        setCursor(undefined);
        setPages([]);
      } else {
        void refetch();
      }
    },
    error: ApiErrorAdapter.toUiError(error),
  };
}
