import { useMemo, useState } from 'react';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import { useGetEarningsReportQuery } from '@/model/api/generated/mentoraApi';
import {
  EarningsAdapter,
  type EarningsBar,
  type EarningsSummary,
} from '@/model/domain/reports/EarningsAdapter';
import { useTranslation } from '@/shared/i18n';

export type { EarningsBar, EarningsSummary };

export interface EarningsViewModel {
  ranges: { value: number; label: string }[];
  range: number;
  setRange: (months: number) => void;
  isLoading: boolean;
  error: UiError | null;
  summary: EarningsSummary | null;
  showTable: boolean;
  toggleTable: () => void;
}

// ViewModel
export function useEarningsViewModel(): EarningsViewModel {
  const { t } = useTranslation();
  const [range, setRange] = useState<number>(6);
  const [showTable, setShowTable] = useState(false);
  const period = useMemo(() => EarningsAdapter.window(new Date(), range), [range]);
  const { data, isFetching, error } = useGetEarningsReportQuery(period, {
    refetchOnMountOrArgChange: true,
  });

  return {
    ranges: EarningsAdapter.RANGES.map((value) => ({
      value,
      label: t('reports.lastMonths', { count: value }),
    })),
    range,
    setRange,
    isLoading: isFetching && !data,
    error: ApiErrorAdapter.toUiError(error),
    summary: useMemo(() => (data ? EarningsAdapter.toSummary(data) : null), [data]),
    showTable,
    toggleTable: () => setShowTable((value) => !value),
  };
}
