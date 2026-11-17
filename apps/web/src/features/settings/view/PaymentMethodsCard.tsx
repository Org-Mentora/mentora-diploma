import { CreditCard, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
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
import type { PaymentMethodsViewModel } from '../viewmodel/usePlanSettingsViewModel';

export function PaymentMethodsCard({ cards }: { cards: PaymentMethodsViewModel }) {
  const addErrors = cards.addForm.formState.errors;
  const editErrors = cards.editForm.formState.errors;

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <CardTitle>Payment methods</CardTitle>
          <CardDescription>
            Only the brand, the last 4 digits and the expiry are stored.
          </CardDescription>
        </div>
        <Button onClick={() => cards.openAdd()}>
          <Plus /> Add card
        </Button>
      </CardHeader>
      <CardContent className="grid gap-2">
        {cards.items.length === 0 ? (
          <EmptyState
            title="No cards yet"
            description="Add one to pay or to enable automatic debit."
          />
        ) : (
          cards.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center gap-3 rounded-md border px-3 py-2 text-sm"
            >
              <CreditCard className="size-4 text-muted-foreground" />
              <span className="font-medium">{item.label}</span>
              <span className="text-muted-foreground">
                {item.holderName} · expires {item.expiry}
              </span>
              {item.isDefault && <Badge variant="secondary">Default</Badge>}
              <div className="ml-auto flex gap-1">
                {!item.isDefault && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void cards.makeDefault(item)}
                    disabled={cards.isSaving}
                  >
                    Make default
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Edit ${item.label}`}
                  onClick={() => cards.startEdit(item)}
                >
                  <Pencil />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Remove ${item.label}`}
                  onClick={() => cards.requestRemove(item)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={cards.isAddOpen} onOpenChange={(open) => !open && cards.closeAdd()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a card</DialogTitle>
            <DialogDescription>
              {cards.addNotice ??
                'Local test mode: 4242 4242 4242 4242 is approved, 4000 0000 0000 0002 is declined.'}
            </DialogDescription>
          </DialogHeader>
          <form
            id="add-card"
            className="grid gap-4 sm:grid-cols-2"
            noValidate
            onSubmit={cards.submitAdd}
          >
            <FormField
              id="holderName"
              label="Name on the card"
              error={addErrors.holderName?.message}
              className="sm:col-span-2"
            >
              <Input
                id="holderName"
                autoComplete="cc-name"
                {...cards.addForm.register('holderName')}
              />
            </FormField>
            <FormField
              id="cardNumber"
              label="Card number"
              error={addErrors.cardNumber?.message}
              className="sm:col-span-2"
            >
              <Input
                id="cardNumber"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="4242 4242 4242 4242"
                {...cards.addForm.register('cardNumber')}
              />
            </FormField>
            <FormField id="expiry" label="Expiry (MM/YY)" error={addErrors.expiry?.message}>
              <Input
                id="expiry"
                autoComplete="cc-exp"
                placeholder="12/30"
                {...cards.addForm.register('expiry')}
              />
            </FormField>
            <FormField id="cvc" label="Security code" error={addErrors.cvc?.message}>
              <Input
                id="cvc"
                inputMode="numeric"
                autoComplete="cc-csc"
                {...cards.addForm.register('cvc')}
              />
            </FormField>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" {...cards.addForm.register('makeDefault')} />
              Use as the default card
            </label>
          </form>
          {addErrors.root && (
            <p role="alert" className="text-destructive text-sm">
              {addErrors.root.message}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={cards.closeAdd}>
              Cancel
            </Button>
            <Button type="submit" form="add-card" disabled={cards.isSaving}>
              Save card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cards.editing !== null} onOpenChange={(open) => !open && cards.closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {cards.editing?.label}</DialogTitle>
            <DialogDescription>To change the number, add a new card.</DialogDescription>
          </DialogHeader>
          <form id="edit-card" className="grid gap-4" noValidate onSubmit={cards.submitEdit}>
            <FormField
              id="editHolder"
              label="Name on the card"
              error={editErrors.holderName?.message}
            >
              <Input id="editHolder" {...cards.editForm.register('holderName')} />
            </FormField>
            <FormField id="editExpiry" label="Expiry (MM/YY)" error={editErrors.expiry?.message}>
              <Input id="editExpiry" {...cards.editForm.register('expiry')} />
            </FormField>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={cards.closeEdit}>
              Cancel
            </Button>
            <Button type="submit" form="edit-card" disabled={cards.isSaving}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={cards.removal !== null}
        destructive
        title={`Remove ${cards.removal?.item.label ?? 'card'}?`}
        description={
          cards.removal?.warning ? (
            <p className="text-destructive">{cards.removal.warning} Remove it anyway?</p>
          ) : (
            <p>The card will no longer be available for payments.</p>
          )
        }
        confirmLabel={cards.removal?.warning ? 'Remove anyway' : 'Remove'}
        busy={cards.isSaving}
        onConfirm={() => void cards.confirmRemove()}
        onCancel={cards.abortRemove}
      />
    </Card>
  );
}
