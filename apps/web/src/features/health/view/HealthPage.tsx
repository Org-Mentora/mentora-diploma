import { RefreshCw } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { useHealthViewModel } from '../viewmodel/useHealthViewModel';

/** View (MVVM): renders the ViewModel state and forwards user intents to its commands. */
export function HealthPage() {
  const { health, isLoading, isRefreshing, error, refresh } = useHealthViewModel();

  return (
    <Card>
      <CardHeader className="flex items-start justify-between">
        <div className="grid gap-1.5">
          <CardTitle>System status</CardTitle>
          <CardDescription>
            {health ? `Uptime ${health.uptime} · checked at ${health.checkedAt}` : 'Checking…'}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={isRefreshing}>
          <RefreshCw className={isRefreshing ? 'animate-spin' : undefined} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4">
        {isLoading && <p className="text-muted-foreground text-sm">Loading status…</p>}
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
                      {component.isUp ? 'up' : 'down'}
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
