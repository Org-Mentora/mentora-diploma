import { useTranslation } from '@/shared/i18n';
import { Button } from './button';

interface LoadMoreProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

export function LoadMore({ hasMore, isLoading, onLoadMore }: LoadMoreProps) {
  const { t } = useTranslation();
  if (!hasMore) {
    return null;
  }
  return (
    <div className="flex justify-center pt-2">
      <Button variant="outline" size="sm" onClick={onLoadMore} disabled={isLoading}>
        {isLoading ? t('common.loading') : t('common.loadMore')}
      </Button>
    </div>
  );
}
