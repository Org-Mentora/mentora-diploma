import { Check, Globe, History, X } from 'lucide-react';
import { Link } from 'react-router';
import { useTranslation } from '@/shared/i18n';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { EmptyState } from '@/shared/ui/empty-state';
import { FormField } from '@/shared/ui/form-field';
import { LoadMore } from '@/shared/ui/load-more';
import { NativeSelect } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import {
  type BookingRequestItem,
  useBookingRequestsViewModel,
} from '../viewmodel/useBookingRequestsViewModel';

function RequestRow({
  item,
  onAccept,
  onReject,
}: {
  item: BookingRequestItem;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <li className="grid gap-1.5 rounded-md border p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{item.requesterName}</span>
        <span className="text-muted-foreground text-xs">{item.dniLabel}</span>
        {item.isNewPatient && <Badge variant="outline">{t('booking.requests.newPatient')}</Badge>}
        {!item.isPending && <Badge variant={item.statusTone}>{item.statusLabel}</Badge>}
      </div>
      <div className="flex flex-wrap gap-x-3 text-muted-foreground text-xs">
        <span className="tabular-nums">{item.when}</span>
        <span>{item.modalityLabel}</span>
        {item.contact && <span>{item.contact}</span>}
      </div>
      {item.reason && <p className="text-xs">{item.reason}</p>}
      {item.decision && <p className="text-muted-foreground text-xs">{item.decision}</p>}
      {item.isPending && onAccept && onReject && (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onReject}>
            <X /> {t('booking.requests.reject')}
          </Button>
          <Button size="sm" onClick={onAccept}>
            <Check /> {t('booking.requests.accept')}
          </Button>
        </div>
      )}
    </li>
  );
}

export function BookingRequestsPanel() {
  const { t } = useTranslation();
  const vm = useBookingRequestsViewModel();
  const { decision } = vm;

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1.5">
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-4" /> {t('booking.requests.title')}
            {vm.pending.length > 0 && <Badge variant="warning">{vm.pending.length}</Badge>}
          </CardTitle>
          <CardDescription>
            {vm.isEnabled ? t('booking.requests.description') : t('booking.requests.disabled')}{' '}
            <Link to="/settings/booking" className="underline">
              {t('booking.requests.configure')}
            </Link>
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={vm.toggleHistory}>
          <History />{' '}
          {vm.showHistory ? t('booking.requests.hideHistory') : t('booking.requests.history')}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3">
        {vm.error && (
          <p role="alert" className="text-destructive text-sm">
            {vm.error.message}
          </p>
        )}
        {vm.isLoading ? (
          <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
        ) : vm.pending.length === 0 ? (
          <EmptyState title={t('booking.requests.empty')} className="p-6" />
        ) : (
          <ul className="grid gap-2">
            {vm.pending.map((item) => (
              <RequestRow
                key={item.id}
                item={item}
                onAccept={() => vm.startAccept(item)}
                onReject={() => vm.startReject(item)}
              />
            ))}
          </ul>
        )}
        <LoadMore
          hasMore={vm.pendingMore.hasMore}
          isLoading={vm.pendingMore.isLoadingMore}
          onLoadMore={vm.pendingMore.loadMore}
        />
        {vm.showHistory && (
          <div className="grid gap-2">
            <h3 className="font-medium text-muted-foreground text-sm">
              {t('booking.requests.history')}
            </h3>
            {vm.history.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('booking.requests.noHistory')}</p>
            ) : (
              <ul className="grid gap-2">
                {vm.history.map((item) => (
                  <RequestRow key={item.id} item={item} />
                ))}
              </ul>
            )}
            <LoadMore
              hasMore={vm.historyMore.hasMore}
              isLoading={vm.historyMore.isLoadingMore}
              onLoadMore={vm.historyMore.loadMore}
            />
          </div>
        )}
      </CardContent>

      <Dialog open={decision !== null} onOpenChange={(open) => !open && vm.cancelDecision()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision?.kind === 'accept'
                ? t('booking.requests.acceptTitle', { name: decision.item.requesterName })
                : t('booking.requests.rejectTitle', { name: decision?.item.requesterName ?? '' })}
            </DialogTitle>
            <DialogDescription>
              {decision?.item.when} · {decision?.item.modalityLabel}
            </DialogDescription>
          </DialogHeader>
          {decision?.kind === 'accept' && (
            <div className="grid gap-4">
              <p className="text-muted-foreground text-sm">
                {decision.item.isNewPatient
                  ? t('booking.requests.acceptNewPatient')
                  : t('booking.requests.acceptExisting')}
              </p>
              <FormField id="booking-type" label={t('agenda.consultationType')}>
                <NativeSelect
                  id="booking-type"
                  value={decision.type}
                  onChange={(event) => vm.setType(event.target.value)}
                >
                  {vm.typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField id="booking-notes" label={t('agenda.notes')}>
                <Textarea
                  id="booking-notes"
                  value={decision.notes}
                  onChange={(event) => vm.setNotes(event.target.value)}
                />
              </FormField>
            </div>
          )}
          {decision?.kind === 'reject' && (
            <FormField
              id="booking-reason"
              label={t('booking.requests.reason')}
              hint={t('booking.requests.reasonHint')}
            >
              <Textarea
                id="booking-reason"
                value={decision.reason}
                onChange={(event) => vm.setReason(event.target.value)}
              />
            </FormField>
          )}
          {vm.decisionError && (
            <p role="alert" className="text-destructive text-sm">
              {vm.decisionError}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={vm.cancelDecision}>
              {t('common.cancel')}
            </Button>
            <Button
              variant={decision?.kind === 'reject' ? 'destructive' : 'default'}
              onClick={() => void vm.confirmDecision()}
              disabled={vm.isDeciding}
            >
              {decision?.kind === 'reject'
                ? t('booking.requests.reject')
                : t('booking.requests.acceptAndSchedule')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
