import { RefreshCw } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';
import { NativeSelect } from '@/shared/ui/select';
import { useActivityViewModel } from '../viewmodel/useActivityViewModel';

export function ActivityPage() {
  const { t } = useTranslation();
  const vm = useActivityViewModel();

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <CardTitle>{t('audit.title')}</CardTitle>
          <CardDescription>{t('audit.description')}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <NativeSelect
            aria-label={t('audit.filter')}
            className="w-48"
            value={vm.category}
            onChange={(event) => vm.setCategory(event.target.value)}
          >
            {vm.categories.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
          <Button
            variant="outline"
            size="icon"
            aria-label={t('health.refresh')}
            onClick={vm.refresh}
          >
            <RefreshCw />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {vm.error && (
          <p role="alert" className="text-destructive text-sm">
            {vm.error.message}
          </p>
        )}
        {vm.isLoading ? (
          <p className="text-muted-foreground text-sm">{t('audit.loading')}</p>
        ) : vm.items.length === 0 ? (
          <EmptyState title={t('audit.empty')} />
        ) : (
          <ol className="grid divide-y rounded-md border">
            {vm.items.map((item) => (
              <li key={item.id} className="grid gap-1 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">{item.title}</span>
                  {item.subject && <span>· {item.subject}</span>}
                  <Badge variant={item.tone}>{item.categoryLabel}</Badge>
                  <span className="ml-auto text-muted-foreground text-xs tabular-nums">
                    {item.when}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground text-xs">
                  <span>{item.actorLabel}</span>
                  {item.origin && <span>{item.origin}</span>}
                  {item.details.map((detail) => (
                    <span key={detail}>{detail}</span>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        )}
        {vm.hasMore && (
          <Button
            variant="outline"
            className="justify-self-center"
            onClick={vm.loadMore}
            disabled={vm.isLoadingMore}
          >
            {vm.isLoadingMore ? t('common.loading') : t('audit.loadMore')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
