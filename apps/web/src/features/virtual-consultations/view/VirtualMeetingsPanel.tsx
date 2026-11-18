import { ExternalLink, Video } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import { Card, CardContent } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';
import { LoadMore } from '@/shared/ui/load-more';
import { useVirtualMeetingHistoryViewModel } from '../viewmodel/useVirtualMeetingHistoryViewModel';

export function VirtualMeetingsPanel({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const vm = useVirtualMeetingHistoryViewModel(patientId);
  const { items, isLoading } = vm;

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">{t('meetings.loading')}</p>;
  }
  if (items.length === 0) {
    return (
      <EmptyState title={t('meetings.emptyTitle')} description={t('meetings.emptyDescription')} />
    );
  }

  return (
    <Card>
      <CardContent className="grid gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center gap-3 text-sm">
            <Video className="size-4 text-muted-foreground" />
            <span className="font-medium">{item.when}</span>
            <span className="text-muted-foreground">
              {item.providerLabel} · {item.origin}
            </span>
            <span className="text-muted-foreground text-xs">{item.invitationLabel}</span>
            <a
              href={item.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 underline"
            >
              {t('meetings.open')} <ExternalLink className="size-3" />
            </a>
          </div>
        ))}
        <LoadMore hasMore={vm.hasMore} isLoading={vm.isLoadingMore} onLoadMore={vm.loadMore} />
      </CardContent>
    </Card>
  );
}
