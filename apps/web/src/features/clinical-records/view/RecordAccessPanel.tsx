import { Card, CardContent } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';
import { useRecordAccessLogViewModel } from '../viewmodel/useRecordAccessLogViewModel';

export function RecordAccessPanel({ patientId }: { patientId: string }) {
  const { items, isLoading, error } = useRecordAccessLogViewModel(patientId);

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading access log…</p>;
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
        title="Nobody has opened this clinical record yet"
        description="Every read and write of the record is logged here."
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
      </CardContent>
    </Card>
  );
}
