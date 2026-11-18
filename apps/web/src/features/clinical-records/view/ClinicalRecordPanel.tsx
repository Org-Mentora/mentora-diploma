import { Link } from 'react-router';
import { useTranslation } from '@/shared/i18n';
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
import { LoadMore } from '@/shared/ui/load-more';
import { useClinicalRecordViewModel } from '../viewmodel/useClinicalRecordViewModel';

export function ClinicalRecordPanel({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const vm = useClinicalRecordViewModel(patientId);

  if (vm.isLoading) {
    return <p className="text-muted-foreground text-sm">{t('clinical.loading')}</p>;
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
        title={t('clinical.emptyTitle')}
        description={t('clinical.emptyDescription')}
        action={
          <Link to={vm.newConsultationPath} className="text-sm underline">
            {t('clinical.registerFirst')}
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
      <LoadMore hasMore={vm.hasMore} isLoading={vm.isLoadingMore} onLoadMore={vm.loadMore} />

      <Dialog
        open={vm.selectedId !== null}
        onOpenChange={(open) => !open && vm.closeConsultation()}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{vm.detail?.title ?? t('clinical.consultation')}</DialogTitle>
            <DialogDescription>{vm.detail?.typeLabel}</DialogDescription>
          </DialogHeader>
          {vm.isLoadingDetail || !vm.detail ? (
            <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
          ) : (
            <dl className="grid gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs">{t('clinical.field.reasonShort')}</dt>
                <dd>{vm.detail.reason}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">{t('clinical.field.evolution')}</dt>
                <dd className="whitespace-pre-wrap">{vm.detail.evolution}</dd>
              </div>
              {vm.detail.observations && (
                <div>
                  <dt className="text-muted-foreground text-xs">
                    {t('patients.profile.observations')}
                  </dt>
                  <dd className="whitespace-pre-wrap">{vm.detail.observations}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground text-xs">{t('clinical.field.diagnosis')}</dt>
                <dd>{vm.detail.diagnosisLabel}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">{t('clinical.medication.name')}</dt>
                <dd>
                  {vm.detail.medications.length === 0 ? (
                    t('clinical.medication.noneShort')
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
