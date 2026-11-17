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
import { NativeSelect } from '@/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import type { PaymentHistoryViewModel } from '../viewmodel/usePlanSettingsViewModel';

export function PaymentHistoryCard({ payments }: { payments: PaymentHistoryViewModel }) {
  const errors = payments.manualForm.formState.errors;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment history</CardTitle>
      </CardHeader>
      <CardContent>
        {payments.items.length === 0 ? (
          <EmptyState title="No payments yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
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
      </CardContent>

      <Dialog open={payments.isManualOpen} onOpenChange={(open) => !open && payments.closeManual()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register a payment</DialogTitle>
            <DialogDescription>
              Record a payment made outside the system. It renews your current plan.
            </DialogDescription>
          </DialogHeader>
          <form
            id="manual-payment"
            className="grid gap-4 sm:grid-cols-2"
            noValidate
            onSubmit={payments.submitManual}
          >
            <FormField id="amount" label="Amount (ARS)" error={errors.amount?.message}>
              <Input
                id="amount"
                type="number"
                min={0}
                {...payments.manualForm.register('amount')}
              />
            </FormField>
            <FormField id="paidAt" label="Payment date" error={errors.paidAt?.message}>
              <Input id="paidAt" type="date" {...payments.manualForm.register('paidAt')} />
            </FormField>
            <FormField id="method" label="Paid with">
              <NativeSelect id="method" {...payments.manualForm.register('method')}>
                {payments.methodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField id="reference" label="Reference (optional)">
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
              Cancel
            </Button>
            <Button type="submit" form="manual-payment" disabled={payments.isSaving}>
              Register payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
