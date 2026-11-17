import type { EarningsReportDto } from '@mentora/contracts';
import { describe, expect, it } from 'vitest';
import { EarningsAdapter } from './EarningsAdapter';

const report: EarningsReportDto = {
  currency: 'ARS',
  from: '2030-01',
  to: '2030-03',
  months: [
    {
      month: '2030-01',
      earned: 60_000,
      projected: 0,
      appointments: 3,
      unpriced: 1,
      byType: [{ type: 'control', earned: 60_000, projected: 0, appointments: 3 }],
    },
    {
      month: '2030-02',
      earned: 20_000,
      projected: 50_000,
      appointments: 3,
      unpriced: 0,
      byType: [
        { type: 'control', earned: 20_000, projected: 20_000, appointments: 2 },
        { type: 'first_visit', earned: 0, projected: 30_000, appointments: 1 },
      ],
    },
    { month: '2030-03', earned: 0, projected: 0, appointments: 0, unpriced: 0, byType: [] },
  ],
  totals: { earned: 80_000, projected: 50_000, appointments: 6, unpriced: 1 },
};

describe('EarningsAdapter (earnings by consultation fee)', () => {
  it('scales the stacked bars to a round ceiling with five ticks', () => {
    const summary = EarningsAdapter.toSummary(report);

    expect(summary.ticks).toHaveLength(5);
    expect(summary.bars.map((bar) => [bar.earnedPercent, bar.projectedPercent])).toEqual([
      [60, 0],
      [20, 50],
      [0, 0],
    ]);
    expect(summary.unpricedLabel).toBe('1 without fee');
    expect(summary.isEmpty).toBe(false);
  });

  it('ranks consultation types by total and share', () => {
    const { byType } = EarningsAdapter.toSummary(report);

    expect(byType.map((row) => [row.type, row.percent, row.appointments])).toEqual([
      ['control', 77, 5],
      ['first_visit', 23, 1],
    ]);
  });

  it('builds a month window ending one month ahead', () => {
    expect(EarningsAdapter.window(new Date(2030, 5, 15), 6)).toEqual({
      from: '2030-01',
      to: '2030-07',
    });
  });
});
