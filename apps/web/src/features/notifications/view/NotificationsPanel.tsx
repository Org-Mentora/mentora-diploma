import { MessageCircle } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';
import { LoadMore } from '@/shared/ui/load-more';
import { useNotificationsViewModel } from '../viewmodel/useNotificationsViewModel';

export function NotificationsPanel({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const vm = useNotificationsViewModel(patientId);
  const { items, isLoading } = vm;

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">{t('notifications.loading')}</p>;
  }
  if (items.length === 0) {
    return (
      <EmptyState
        title={t('notifications.emptyTitle')}
        description={t('notifications.emptyDescription')}
      />
    );
  }

  return (
    <Card>
      <CardContent className="grid gap-3">
        {items.map((item) => (
          <div key={item.id} className="grid gap-1 border-b pb-3 last:border-b-0 last:pb-0">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <MessageCircle className="size-4 text-muted-foreground" />
              <span className="font-medium">{item.topicLabel}</span>
              <Badge variant={item.statusTone}>{item.statusLabel}</Badge>
              <span className="ml-auto text-muted-foreground text-xs">
                {item.when} · {item.channelLabel} · {item.recipient}
              </span>
            </div>
            <p className="text-muted-foreground text-sm">{item.body}</p>
            {item.detail && <p className="text-destructive text-xs">{item.detail}</p>}
          </div>
        ))}
        <LoadMore hasMore={vm.hasMore} isLoading={vm.isLoadingMore} onLoadMore={vm.loadMore} />
      </CardContent>
    </Card>
  );
}
