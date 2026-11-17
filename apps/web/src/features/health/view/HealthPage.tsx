import { RefreshCw } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { useHealthViewModel } from '../viewmodel/useHealthViewModel';

export function HealthPage() {
  const { t } = useTranslation();
  const { health, isLoading, isRefreshing, error, refresh } = useHealthViewModel();

  return (
    <Card>
      <CardHeader className="flex items-start justify-between">
        <div className="grid gap-1.5">
          <CardTitle>{t('health.title')}</CardTitle>
          <CardDescription>
            {health
              ? t('health.uptime', { uptime: health.uptime, checkedAt: health.checkedAt })
              : t('health.checking')}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={isRefreshing}>
          <RefreshCw className={isRefreshing ? 'animate-spin' : undefined} />
          {t('health.refresh')}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4">
        {isLoading && <p className="text-muted-foreground text-sm">{t('health.loading')}</p>}
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error.message}
          </p>
        )}
        {health && (
          <>
            <Badge variant={health.tone}>{health.label}</Badge>
            <ul className="divide-y rounded-md border">
              {health.components.map((component) => (
                <li key={component.name} className="flex items-center justify-between px-4 py-3">
                  <span className="font-medium">{component.name}</span>
                  <span className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{component.detail}</span>
                    <Badge variant={component.isUp ? 'success' : 'danger'}>
                      {component.isUp ? t('health.up') : t('health.down')}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
