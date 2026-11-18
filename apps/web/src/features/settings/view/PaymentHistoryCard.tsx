import { useTranslation } from '@/shared/i18n';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
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
import { Input } from '@/shared/ui/input';
import { LoadMore } from '@/shared/ui/load-more';
import { NativeSelect } from '@/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import type { PaymentHistoryViewModel } from '../viewmodel/usePlanSettingsViewModel';

export function PaymentHistoryCard({ payments }: { payments: PaymentHistoryViewModel }) {
  const { t } = useTranslation();
  const errors = payments.manualForm.formState.errors;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.payments.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {payments.items.length === 0 ? (
          <EmptyState title={t('settings.payments.empty')} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('agenda.date')}</TableHead>
                <TableHead>{t('settings.payments.amount')}</TableHead>
                <TableHead>{t('settings.payments.plan')}</TableHead>
                <TableHead>{t('clinical.field.type')}</TableHead>
                <TableHead>{t('settings.payments.method')}</TableHead>
                <TableHead>{t('patients.list.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.items.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell className="font-medium">{payment.amount}</TableCell>
                  <TableCell>{payment.planName}</TableCell>
                  <TableCell>{payment.kindLabel}</TableCell>
                  <TableCell>{payment.methodLabel}</TableCell>
                  <TableCell>
                    <Badge variant={payment.statusTone} title={payment.detail}>
                      {payment.statusLabel}
                    </Badge>
                    {payment.detail && (
                      <span className="ml-2 text-muted-foreground text-xs">{payment.detail}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <LoadMore
          hasMore={payments.hasMore}
          isLoading={payments.isLoadingMore}
          onLoadMore={payments.loadMore}
        />
      </CardContent>

      <Dialog open={payments.isManualOpen} onOpenChange={(open) => !open && payments.closeManual()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.payments.register')}</DialogTitle>
            <DialogDescription>{t('settings.payments.registerDescription')}</DialogDescription>
          </DialogHeader>
          <form
            id="manual-payment"
            className="grid gap-4 sm:grid-cols-2"
            noValidate
            onSubmit={payments.submitManual}
          >
            <FormField
              id="amount"
              label={t('settings.payments.amountArs')}
              error={errors.amount?.message}
            >
              <Input
                id="amount"
                type="number"
                min={0}
                {...payments.manualForm.register('amount')}
              />
            </FormField>
            <FormField
              id="paidAt"
              label={t('settings.payments.date')}
              error={errors.paidAt?.message}
            >
              <Input id="paidAt" type="date" {...payments.manualForm.register('paidAt')} />
            </FormField>
            <FormField id="method" label={t('settings.payments.paidWith')}>
              <NativeSelect id="method" {...payments.manualForm.register('method')}>
                {payments.methodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField id="reference" label={t('settings.payments.reference')}>
              <Input id="reference" {...payments.manualForm.register('reference')} />
            </FormField>
          </form>
          {errors.root && (
            <p role="alert" className="text-destructive text-sm">
              {errors.root.message}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={payments.closeManual}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form="manual-payment" disabled={payments.isSaving}>
              {t('settings.payments.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
