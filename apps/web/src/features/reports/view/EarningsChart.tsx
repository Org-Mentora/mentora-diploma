import { useTranslation } from '@/shared/i18n';
import { cn } from '@/shared/lib/utils';
import type { EarningsBar, EarningsSummary } from '../viewmodel/useEarningsViewModel';

function Swatch({ className }: { className: string }) {
  return <span aria-hidden className={`inline-block size-2.5 rounded-sm ${className}`} />;
}

type TooltipAlign = 'start' | 'center' | 'end';

const TOOLTIP_ALIGN: Record<TooltipAlign, string> = {
  start: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  end: 'right-0',
};

function tooltipAlign(index: number, total: number): TooltipAlign {
  if (index < total / 4) {
    return 'start';
  }
  if (index >= total - total / 4) {
    return 'end';
  }
  return 'center';
}

function Bar({ bar, align }: { bar: EarningsBar; align: TooltipAlign }) {
  const { t } = useTranslation();
  const hasEarned = bar.earnedPercent > 0;
  const hasProjected = bar.projectedPercent > 0;
  return (
    <div className="group relative flex h-full min-w-0 flex-1 flex-col items-center">
      <button
        type="button"
        className="flex h-full w-full max-w-12 flex-col justify-end rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${bar.longLabel}: ${t('reports.earned')} ${bar.earnedLabel}, ${t('reports.projected')} ${bar.projectedLabel}`}
      >
        {hasProjected && (
          <span
            className="block w-full rounded-t-[4px] bg-chart-projected transition-opacity group-hover:opacity-85"
            style={{ height: `${bar.projectedPercent}%` }}
          />
        )}
        {hasProjected && hasEarned && <span className="block h-0.5 w-full shrink-0" />}
        {hasEarned && (
          <span
            className={`block w-full bg-chart-earned transition-opacity group-hover:opacity-85 ${hasProjected ? '' : 'rounded-t-[4px]'}`}
            style={{ height: `${bar.earnedPercent}%` }}
          />
        )}
      </button>
      <div
        role="tooltip"
        className={cn(
          'pointer-events-none absolute bottom-full z-10 mb-2 hidden w-max max-w-[min(16rem,80vw)] rounded-md border bg-card px-3 py-2 text-card-foreground text-xs shadow-md group-focus-within:block group-hover:block',
          TOOLTIP_ALIGN[align],
        )}
      >
        <p className="mb-1 font-medium first-letter:uppercase">{bar.longLabel}</p>
        <p className="flex items-center gap-1.5">
          <Swatch className="bg-chart-earned" /> {t('reports.earned')}:{' '}
          <span className="tabular-nums">{bar.earnedLabel}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <Swatch className="bg-chart-projected" /> {t('reports.projected')}:{' '}
          <span className="tabular-nums">{bar.projectedLabel}</span>
        </p>
        <p className="mt-1 text-muted-foreground">{bar.appointmentsLabel}</p>
        {bar.unpricedLabel && <p className="text-muted-foreground">{bar.unpricedLabel}</p>}
      </div>
    </div>
  );
}

export function EarningsChart({ summary }: { summary: EarningsSummary }) {
  const { t } = useTranslation();
  return (
    <figure className="grid min-w-0 gap-3">
      <figcaption className="flex flex-wrap items-center gap-4 text-muted-foreground text-xs">
        <span className="flex items-center gap-1.5">
          <Swatch className="bg-chart-earned" /> {t('reports.earned')}
        </span>
        <span className="flex items-center gap-1.5">
          <Swatch className="bg-chart-projected" /> {t('reports.projected')}
        </span>
      </figcaption>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
        <div className="relative h-60 w-14 text-right text-muted-foreground text-xs tabular-nums">
          {summary.ticks.map((tick) => (
            <span
              key={tick.percent}
              className="absolute right-0 translate-y-1/2"
              style={{ bottom: `${tick.percent}%` }}
            >
              {tick.label}
            </span>
          ))}
        </div>
        <div className="relative h-60">
          {summary.ticks.map((tick) => (
            <span
              key={tick.percent}
              aria-hidden
              className={`absolute inset-x-0 border-t ${tick.percent === 0 ? 'border-border' : 'border-border/50 border-dashed'}`}
              style={{ bottom: `${tick.percent}%` }}
            />
          ))}
          <div className="relative flex h-full items-end gap-1 sm:gap-2">
            {summary.bars.map((bar, index) => (
              <Bar key={bar.month} bar={bar} align={tooltipAlign(index, summary.bars.length)} />
            ))}
          </div>
        </div>
        <span />
        <div className="mt-2 flex min-w-0 gap-1 sm:gap-2">
          {summary.bars.map((bar, index) => (
            <span
              key={bar.month}
              className={cn(
                'min-w-0 flex-1 truncate text-center text-[11px] text-muted-foreground first-letter:uppercase sm:text-xs',
                summary.bars.length > 8 && index % 2 === 1 && 'max-sm:invisible',
              )}
            >
              {bar.label}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}
