import { useTranslation } from '@/shared/i18n';
import { Card, CardContent } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';
import { useDiagnosisHistoryViewModel } from '../viewmodel/useDiagnosisHistoryViewModel';

export function DiagnosisHistoryPanel({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const { items, isLoading, error } = useDiagnosisHistoryViewModel(patientId);

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">{t('clinical.diagnosis.loading')}</p>;
  }
  if (error) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {error.message}
      </p>
    );
  }
  if (items.length === 0) {
    return <EmptyState title={t('clinical.diagnosis.empty')} />;
  }

  return (
    <Card>
      <CardContent>
        <ol className="grid gap-4">
          {items.map((item) => (
            <li key={item.key} className="border-l-2 pl-3">
              <p className="font-medium text-sm">{item.label}</p>
              <p className="text-muted-foreground text-xs">{item.dateLabel}</p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
