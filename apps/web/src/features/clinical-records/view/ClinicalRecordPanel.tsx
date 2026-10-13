import { Link } from 'react-router';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent } from '@/shared/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { EmptyState } from '@/shared/ui/empty-state';
import { useClinicalRecordViewModel } from '../viewmodel/useClinicalRecordViewModel';

/** CU-08: consultations newest first; clicking one opens its full detail. */
export function ClinicalRecordPanel({ patientId }: { patientId: string }) {
  const vm = useClinicalRecordViewModel(patientId);

  if (vm.isLoading) {
    return <p className="text-muted-foreground text-sm">Loading clinical record…</p>;
  }
  if (vm.error) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {vm.error.message}
      </p>
    );
  }
  if (vm.timeline.length === 0) {
    return (
      <EmptyState
        title="The clinical record is empty"
        description="Consultations you register will appear here."
        action={
          <Link to={vm.newConsultationPath} className="text-sm underline">
            Register the first consultation
          </Link>
        }
      />
    );
  }

  return (
    <>
      <ol className="grid gap-3">
        {vm.timeline.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="w-full text-left"
              onClick={() => vm.openConsultation(item.id)}
            >
              <Card className="gap-2 py-4 transition-colors hover:bg-accent/50">
                <CardContent className="grid gap-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">{item.dateLabel}</span>
                    <Badge variant="outline">{item.typeLabel}</Badge>
                    <span className="text-muted-foreground">{item.medicationsLabel}</span>
                  </div>
                  <p className="text-sm">{item.reason}</p>
                  {item.diagnosisLabel && (
                    <p className="text-muted-foreground text-xs">{item.diagnosisLabel}</p>
                  )}
                </CardContent>
              </Card>
            </button>
          </li>
        ))}
      </ol>

      <Dialog
        open={vm.selectedId !== null}
        onOpenChange={(open) => !open && vm.closeConsultation()}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{vm.detail?.title ?? 'Consultation'}</DialogTitle>
            <DialogDescription>{vm.detail?.typeLabel}</DialogDescription>
          </DialogHeader>
          {vm.isLoadingDetail || !vm.detail ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : (
            <dl className="grid gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs">Reason</dt>
                <dd>{vm.detail.reason}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Evolution</dt>
                <dd className="whitespace-pre-wrap">{vm.detail.evolution}</dd>
              </div>
              {vm.detail.observations && (
                <div>
                  <dt className="text-muted-foreground text-xs">Observations</dt>
                  <dd className="whitespace-pre-wrap">{vm.detail.observations}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground text-xs">Diagnosis (DSM-5)</dt>
                <dd>{vm.detail.diagnosisLabel}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Medication</dt>
                <dd>
                  {vm.detail.medications.length === 0 ? (
                    'No medication prescribed'
                  ) : (
                    <ul className="grid gap-2">
                      {vm.detail.medications.map((m) => (
                        <li key={m.key}>
                          <span className="font-medium">{m.name}</span> — {m.posology}
                          {m.indications && (
                            <p className="text-muted-foreground text-xs">{m.indications}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
