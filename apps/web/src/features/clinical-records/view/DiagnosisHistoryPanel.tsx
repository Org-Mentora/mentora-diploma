import { Card, CardContent } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';
import { useDiagnosisHistoryViewModel } from '../viewmodel/useDiagnosisHistoryViewModel';

/** CU-11 step 10: every diagnosis assigned to the patient, newest first. */
export function DiagnosisHistoryPanel({ patientId }: { patientId: string }) {
  const { items, isLoading, error } = useDiagnosisHistoryViewModel(patientId);

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading diagnoses…</p>;
  }
  if (error) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {error.message}
      </p>
    );
  }
  if (items.length === 0) {
    return <EmptyState title="No diagnoses recorded for this patient" />;
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
