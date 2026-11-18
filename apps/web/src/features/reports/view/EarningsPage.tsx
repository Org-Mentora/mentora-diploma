import { Table2 } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from '@/shared/i18n';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';
import { NativeSelect } from '@/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { useEarningsViewModel } from '../viewmodel/useEarningsViewModel';
import { EarningsChart } from './EarningsChart';

function Stat({ label, value, note }: { label: string; value: string; note?: string | null }) {
  return (
    <Card className="gap-1 py-4">
      <CardContent className="grid gap-1">
        <span className="text-muted-foreground text-xs">{label}</span>
        <span className="font-semibold text-2xl tabular-nums">{value}</span>
        {note && <span className="text-muted-foreground text-xs">{note}</span>}
      </CardContent>
    </Card>
  );
}

export function EarningsPage() {
  const { t } = useTranslation();
  const vm = useEarningsViewModel();
  const { summary } = vm;

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">{t('reports.title')}</h1>
          <p className="text-muted-foreground text-sm">
            {summary?.rangeLabel ?? t('reports.description')}
          </p>
        </div>
        <NativeSelect
          aria-label={t('reports.range')}
          className="w-full sm:w-48"
          value={String(vm.range)}
          onChange={(event) => vm.setRange(Number(event.target.value))}
        >
          {vm.ranges.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      {vm.error && (
        <p role="alert" className="text-destructive text-sm">
          {vm.error.message}
        </p>
      )}

      {vm.isLoading || !summary ? (
        <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label={t('reports.earned')} value={summary.earnedLabel} />
            <Stat label={t('reports.projected')} value={summary.projectedLabel} />
            <Stat
              label={t('reports.total')}
              value={summary.totalLabel}
              note={[summary.appointmentsLabel, summary.unpricedLabel].filter(Boolean).join(' · ')}
            />
          </div>

          <Card>
            <CardHeader className="flex flex-wrap items-start justify-between gap-3">
              <div className="grid gap-1.5">
                <CardTitle>{t('reports.chartTitle')}</CardTitle>
                <CardDescription>{t('reports.chartDescription')}</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={vm.toggleTable}>
                <Table2 /> {vm.showTable ? t('reports.hideTable') : t('reports.showTable')}
              </Button>
            </CardHeader>
            <CardContent className="grid gap-6">
              {summary.isEmpty ? (
                <EmptyState
                  title={t('reports.emptyTitle')}
                  description={t('reports.emptyDescription')}
                  action={
                    <Link to="/settings/fees" className="text-sm underline">
                      {t('reports.configureFees')}
                    </Link>
                  }
                />
              ) : (
                <EarningsChart summary={summary} />
              )}
              {vm.showTable && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('reports.month')}</TableHead>
                      <TableHead className="text-right">{t('reports.earned')}</TableHead>
                      <TableHead className="text-right">{t('reports.projected')}</TableHead>
                      <TableHead className="text-right">{t('reports.total')}</TableHead>
                      <TableHead>{t('nav.agenda')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.bars.map((bar) => (
                      <TableRow key={bar.month}>
                        <TableCell className="first-letter:uppercase">{bar.longLabel}</TableCell>
                        <TableCell className="text-right tabular-nums">{bar.earnedLabel}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {bar.projectedLabel}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {bar.totalLabel}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {[bar.appointmentsLabel, bar.unpricedLabel].filter(Boolean).join(' · ')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {summary.byType.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.byTypeTitle')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3">
                  {summary.byType.map((row) => (
                    <li key={row.type} className="grid gap-1 text-sm">
                      <div className="flex items-baseline justify-between gap-2">
                        <span>{row.label}</span>
                        <span className="tabular-nums">
                          {row.totalLabel}{' '}
                          <span className="text-muted-foreground text-xs">
                            ({row.percent}% ·{' '}
                            {t('reports.appointments', { count: row.appointments })})
                          </span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-chart-earned"
                          style={{ width: `${row.percent}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
