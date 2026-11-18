import { useState } from 'react';
import { useListAuditEventsQuery } from '@/model/api/generated/mentoraApi';
import { type UiPagedList, usePagedList } from '@/model/api/usePagedList';
import { AUDIT_CATEGORIES, AuditAdapter, type AuditItem } from '@/model/domain/audit/AuditAdapter';
import { useTranslation } from '@/shared/i18n';

export type { AuditItem };

export interface ActivityViewModel extends UiPagedList<AuditItem> {
  categories: { value: string; label: string }[];
  category: string;
  setCategory: (category: string) => void;
}

const PAGE_SIZE = 20;

// ViewModel
export function useActivityViewModel(): ActivityViewModel {
  const { t } = useTranslation();
  const [category, setCategory] = useState('');
  const list = usePagedList(
    useListAuditEventsQuery,
    category ? { limit: PAGE_SIZE, category } : { limit: PAGE_SIZE },
    (dtos) => dtos.map(AuditAdapter.toItem),
  );

  return {
    ...list,
    categories: [
      { value: '', label: t('audit.allCategories') },
      ...AUDIT_CATEGORIES.map((value) => ({ value, label: AuditAdapter.categoryLabel(value) })),
    ],
    category,
    setCategory,
  };
}
