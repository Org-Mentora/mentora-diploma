import { AlertTriangle, Check } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { EmptyState } from '@/shared/ui/empty-state';
import { usePlanSettingsViewModel } from '../viewmodel/usePlanSettingsViewModel';
import { PaymentHistoryCard } from './PaymentHistoryCard';
import { PaymentMethodsCard } from './PaymentMethodsCard';

export function PlanSettingsPage() {
  const { t } = useTranslation();
  const vm = usePlanSettingsViewModel();

  if (vm.isLoading) {
    return <p className="text-muted-foreground text-sm">{t('settings.plan.loading')}</p>;
  }
  if (!vm.overview) {
    return <EmptyState title={t('settings.plan.loadFailed')} description={vm.error?.message} />;
  }
  const { overview } = vm;

  return (
    <div className="grid gap-6">
      <Card className={overview.needsAction ? 'border-destructive' : undefined}>
        <CardHeader className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-1.5">
            <CardTitle className="flex items-center gap-3">
              {overview.planName}
              <Badge variant={overview.statusTone}>{overview.statusLabel}</Badge>
            </CardTitle>
            <CardDescription>{overview.periodLabel}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => vm.requestAutoDebit(!overview.autoDebit)}
              disabled={vm.isSaving}
            >
              {overview.autoDebit
                ? t('settings.plan.autoDebitOff')
                : t('settings.plan.autoDebitOn')}
            </Button>
            <Button variant="outline" onClick={vm.payments.openManual}>
              {t('settings.payments.register')}
            </Button>
            {!overview.isCancelled && (
              <Button variant="ghost" onClick={vm.requestCancel}>
                {t('settings.plan.cancel')}
              </Button>
            )}
          </div>
        </CardHeader>
        {overview.needsAction && (
          <CardContent>
            <p className="flex items-center gap-2 text-destructive text-sm" role="alert">
              <AlertTriangle className="size-4" />
              {t('settings.plan.restricted')}
            </p>
          </CardContent>
        )}
      </Card>

      <section className="grid gap-3">
        <h2 className="font-semibold">{t('settings.plan.plans')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {vm.plans.map((plan) => (
            <Card key={plan.id} className={plan.isCurrent ? 'border-primary' : undefined}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {plan.isCurrent && (
                    <Badge variant="secondary">
                      <Check className="size-3" /> {t('settings.plan.current')}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <span className="font-semibold text-lg">{plan.priceLabel}</span>
                <Button
                  variant={plan.isCurrent ? 'outline' : 'default'}
                  disabled={
                    vm.isSaving || (plan.isCurrent && overview.hasAccess && !overview.isCancelled)
                  }
                  onClick={() => vm.requestPlan(plan)}
                >
                  {plan.isCurrent && !overview.hasAccess
                    ? t('settings.plan.payReactivate')
                    : t('settings.plan.choose')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <PaymentMethodsCard cards={vm.cards} />
      <PaymentHistoryCard payments={vm.payments} />

      <ConfirmDialog
        open={vm.pendingPlan !== null}
        title={t('settings.plan.chooseTitle', { plan: vm.pendingPlan?.option.name ?? '' })}
        description={
          vm.pendingPlan?.chargesNow ? (
            <p>{t('settings.plan.chargeNow', { price: vm.pendingPlan.option.priceLabel })}</p>
          ) : (
            <p>
              {vm.pendingPlan?.option.priceLabel}. {t('settings.plan.nextRenewal')}
            </p>
          )
        }
        confirmLabel={
          vm.pendingPlan?.chargesNow ? t('settings.plan.payNow') : t('settings.plan.confirm')
        }
        busy={vm.isSaving}
        onConfirm={() => void vm.confirmPlan()}
        onCancel={vm.abortPlan}
      />
      <ConfirmDialog
        open={vm.pendingAutoDebit !== null}
        title={
          vm.pendingAutoDebit ? t('settings.plan.autoDebitOn') : t('settings.plan.autoDebitOff')
        }
        description={
          vm.pendingAutoDebit ? (
            <p>{t('settings.plan.autoDebitOnDescription')}</p>
          ) : (
            <p>{t('settings.plan.autoDebitOffDescription')}</p>
          )
        }
        confirmLabel={t('common.confirm')}
        busy={vm.isSaving}
        onConfirm={() => void vm.confirmAutoDebit()}
        onCancel={vm.abortAutoDebit}
      />
      <ConfirmDialog
        open={vm.isCancelling}
        destructive
        title={t('settings.plan.cancelTitle')}
        description={
          <>
            <p>{t('settings.plan.cancelDescription1')}</p>
            <p>{t('settings.plan.cancelDescription2')}</p>
          </>
        }
        confirmLabel={t('settings.plan.cancel')}
        cancelLabel={t('agenda.keep')}
        busy={vm.isSaving}
        onConfirm={() => void vm.confirmCancel()}
        onCancel={vm.abortCancel}
      />
    </div>
  );
}
