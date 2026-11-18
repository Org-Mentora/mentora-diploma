import { useTranslation } from '@/shared/i18n';
import { Card, CardContent } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';
import { LoadMore } from '@/shared/ui/load-more';
import { useRecordAccessLogViewModel } from '../viewmodel/useRecordAccessLogViewModel';

export function RecordAccessPanel({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const vm = useRecordAccessLogViewModel(patientId);
  const { items, isLoading, error } = vm;

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">{t('clinical.access.loading')}</p>;
  }
  if (error) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {error.message}
      </p>
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        title={t('clinical.access.emptyTitle')}
        description={t('clinical.access.emptyDescription')}
      />
    );
  }

  return (
    <Card>
      <CardContent>
        <ol className="grid gap-2">
          {items.map((item) => (
            <li key={item.key} className="flex flex-wrap justify-between gap-2 text-sm">
              <span>{item.actionLabel}</span>
              <span className="text-muted-foreground text-xs">{item.whenLabel}</span>
            </li>
          ))}
        </ol>
        <LoadMore hasMore={vm.hasMore} isLoading={vm.isLoadingMore} onLoadMore={vm.loadMore} />
      </CardContent>
    </Card>
  );
}
