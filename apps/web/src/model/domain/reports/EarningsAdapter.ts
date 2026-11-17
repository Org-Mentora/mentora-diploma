import type { EarningsReportDto } from '@mentora/contracts';
import { addMonths, format } from 'date-fns';
import { translate as t } from '@/shared/i18n';
import { typeLabel } from '../appointments/AgendaAdapter';
import { Formats } from '../format/Formats';

export interface EarningsBar {
  month: string;
  label: string;
  longLabel: string;
  earned: number;
  projected: number;
  earnedLabel: string;
  projectedLabel: string;
  totalLabel: string;
  appointmentsLabel: string;
  unpricedLabel: string | null;
  earnedPercent: number;
  projectedPercent: number;
}

export interface EarningsTick {
  label: string;
  percent: number;
}

export interface EarningsTypeRow {
  type: string;
  label: string;
  totalLabel: string;
  appointments: number;
  percent: number;
}

export interface EarningsSummary {
  rangeLabel: string;
  earnedLabel: string;
  projectedLabel: string;
  totalLabel: string;
  appointmentsLabel: string;
  unpricedLabel: string | null;
  bars: EarningsBar[];
  ticks: EarningsTick[];
  byType: EarningsTypeRow[];
  isEmpty: boolean;
}

export interface MonthWindow {
  from: string;
  to: string;
}

function niceCeiling(value: number): number {
  if (value <= 0) {
    return 1;
  }
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((m) => m * magnitude >= value) ?? 10;
  return step * magnitude;
}

// Adapter
export class EarningsAdapter {
  static readonly RANGES = [3, 6, 12] as const;

  static window(today: Date, monthsBack: number, monthsAhead = 1): MonthWindow {
    return {
      from: format(addMonths(today, -(monthsBack - 1)), 'yyyy-MM'),
      to: format(addMonths(today, monthsAhead), 'yyyy-MM'),
    };
  }

  static toSummary(dto: EarningsReportDto): EarningsSummary {
    const money = (amount: number) => Formats.money(amount, dto.currency);
    const scale = niceCeiling(Math.max(0, ...dto.months.map((m) => m.earned + m.projected)));
    const percent = (amount: number) => (amount / scale) * 100;

    const typeTotals = new Map<string, { total: number; appointments: number }>();
    for (const month of dto.months) {
      for (const row of month.byType) {
        const current = typeTotals.get(row.type) ?? { total: 0, appointments: 0 };
        typeTotals.set(row.type, {
          total: current.total + row.earned + row.projected,
          appointments: current.appointments + row.appointments,
        });
      }
    }
    const grandTotal = dto.totals.earned + dto.totals.projected;

    return {
      rangeLabel: `${Formats.month(dto.from, 'long')} – ${Formats.month(dto.to, 'long')}`,
      earnedLabel: money(dto.totals.earned),
      projectedLabel: money(dto.totals.projected),
      totalLabel: money(grandTotal),
      appointmentsLabel: t('reports.appointments', { count: dto.totals.appointments }),
      unpricedLabel:
        dto.totals.unpriced > 0 ? t('reports.unpriced', { count: dto.totals.unpriced }) : null,
      bars: dto.months.map((m) => ({
        month: m.month,
        label: Formats.month(m.month),
        longLabel: Formats.month(m.month, 'long'),
        earned: m.earned,
        projected: m.projected,
        earnedLabel: money(m.earned),
        projectedLabel: money(m.projected),
        totalLabel: money(m.earned + m.projected),
        appointmentsLabel: t('reports.appointments', { count: m.appointments }),
        unpricedLabel: m.unpriced > 0 ? t('reports.unpriced', { count: m.unpriced }) : null,
        earnedPercent: percent(m.earned),
        projectedPercent: percent(m.projected),
      })),
      ticks: [0, 0.25, 0.5, 0.75, 1].map((fraction) => ({
        label: Formats.compactMoney(scale * fraction, dto.currency),
        percent: fraction * 100,
      })),
      byType: [...typeTotals.entries()]
        .filter(([, value]) => value.appointments > 0)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([type, value]) => ({
          type,
          label: typeLabel(type as Parameters<typeof typeLabel>[0]),
          totalLabel: money(value.total),
          appointments: value.appointments,
          percent: grandTotal > 0 ? Math.round((value.total / grandTotal) * 100) : 0,
        })),
      isEmpty: dto.totals.appointments === 0,
    };
  }
}
