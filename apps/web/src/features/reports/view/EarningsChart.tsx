import { useTranslation } from '@/shared/i18n';
import type { EarningsBar, EarningsSummary } from '../viewmodel/useEarningsViewModel';

function Swatch({ className }: { className: string }) {
  return <span aria-hidden className={`inline-block size-2.5 rounded-sm ${className}`} />;
}

function Bar({ bar }: { bar: EarningsBar }) {
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
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max -translate-x-1/2 rounded-md border bg-card px-3 py-2 text-card-foreground text-xs shadow-md group-focus-within:block group-hover:block"
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
    <figure className="grid gap-3">
      <figcaption className="flex flex-wrap items-center gap-4 text-muted-foreground text-xs">
        <span className="flex items-center gap-1.5">
          <Swatch className="bg-chart-earned" /> {t('reports.earned')}
        </span>
        <span className="flex items-center gap-1.5">
          <Swatch className="bg-chart-projected" /> {t('reports.projected')}
        </span>
      </figcaption>
      <div className="grid grid-cols-[auto_1fr] gap-x-2">
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
            {summary.bars.map((bar) => (
              <Bar key={bar.month} bar={bar} />
            ))}
          </div>
        </div>
        <span />
        <div className="mt-2 flex gap-1 sm:gap-2">
          {summary.bars.map((bar) => (
            <span
              key={bar.month}
              className="min-w-0 flex-1 truncate text-center text-muted-foreground text-xs first-letter:uppercase"
            >
              {bar.label}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}
