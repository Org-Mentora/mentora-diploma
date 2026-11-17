import { CreditCard, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
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
  const { t } = useTranslation();
  const addErrors = cards.addForm.formState.errors;
  const editErrors = cards.editForm.formState.errors;

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <CardTitle>{t('settings.cards.title')}</CardTitle>
          <CardDescription>{t('settings.cards.description')}</CardDescription>
        </div>
        <Button onClick={() => cards.openAdd()}>
          <Plus /> {t('settings.cards.add')}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-2">
        {cards.items.length === 0 ? (
          <EmptyState
            title={t('settings.cards.emptyTitle')}
            description={t('settings.cards.emptyDescription')}
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
                {item.holderName} · {t('settings.cards.expires', { expiry: item.expiry })}
              </span>
              {item.isDefault && <Badge variant="secondary">{t('settings.cards.default')}</Badge>}
              <div className="ml-auto flex gap-1">
                {!item.isDefault && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void cards.makeDefault(item)}
                    disabled={cards.isSaving}
                  >
                    {t('settings.cards.makeDefault')}
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={t('settings.cards.editLabel', { card: item.label })}
                  onClick={() => cards.startEdit(item)}
                >
                  <Pencil />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={t('settings.cards.removeLabel', { card: item.label })}
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
            <DialogTitle>{t('settings.cards.addTitle')}</DialogTitle>
            <DialogDescription>{cards.addNotice ?? t('settings.cards.testMode')}</DialogDescription>
          </DialogHeader>
          <form
            id="add-card"
            className="grid gap-4 sm:grid-cols-2"
            noValidate
            onSubmit={cards.submitAdd}
          >
            <FormField
              id="holderName"
              label={t('settings.cards.holder')}
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
              label={t('settings.cards.number')}
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
            <FormField
              id="expiry"
              label={t('settings.cards.expiry')}
              error={addErrors.expiry?.message}
            >
              <Input
                id="expiry"
                autoComplete="cc-exp"
                placeholder="12/30"
                {...cards.addForm.register('expiry')}
              />
            </FormField>
            <FormField id="cvc" label={t('settings.cards.cvc')} error={addErrors.cvc?.message}>
              <Input
                id="cvc"
                inputMode="numeric"
                autoComplete="cc-csc"
                {...cards.addForm.register('cvc')}
              />
            </FormField>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" {...cards.addForm.register('makeDefault')} />
              {t('settings.cards.useDefault')}
            </label>
          </form>
          {addErrors.root && (
            <p role="alert" className="text-destructive text-sm">
              {addErrors.root.message}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={cards.closeAdd}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form="add-card" disabled={cards.isSaving}>
              {t('settings.cards.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cards.editing !== null} onOpenChange={(open) => !open && cards.closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('settings.cards.editLabel', { card: cards.editing?.label ?? '' })}
            </DialogTitle>
            <DialogDescription>{t('settings.cards.editDescription')}</DialogDescription>
          </DialogHeader>
          <form id="edit-card" className="grid gap-4" noValidate onSubmit={cards.submitEdit}>
            <FormField
              id="editHolder"
              label={t('settings.cards.holder')}
              error={editErrors.holderName?.message}
            >
              <Input id="editHolder" {...cards.editForm.register('holderName')} />
            </FormField>
            <FormField
              id="editExpiry"
              label={t('settings.cards.expiry')}
              error={editErrors.expiry?.message}
            >
              <Input id="editExpiry" {...cards.editForm.register('expiry')} />
            </FormField>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={cards.closeEdit}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form="edit-card" disabled={cards.isSaving}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={cards.removal !== null}
        destructive
        title={t('settings.cards.removeTitle', { card: cards.removal?.item.label ?? '' })}
        description={
          cards.removal?.warning ? (
            <p className="text-destructive">
              {cards.removal.warning} {t('settings.cards.removeAnywayQuestion')}
            </p>
          ) : (
            <p>{t('settings.cards.removeDescription')}</p>
          )
        }
        confirmLabel={
          cards.removal?.warning
            ? t('settings.cards.removeAnyway')
            : t('clinical.medication.remove')
        }
        busy={cards.isSaving}
        onConfirm={() => void cards.confirmRemove()}
        onCancel={cards.abortRemove}
      />
    </Card>
  );
}
