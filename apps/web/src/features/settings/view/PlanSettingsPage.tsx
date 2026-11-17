import { AlertTriangle, Check } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { EmptyState } from '@/shared/ui/empty-state';
import { usePlanSettingsViewModel } from '../viewmodel/usePlanSettingsViewModel';
import { PaymentHistoryCard } from './PaymentHistoryCard';
import { PaymentMethodsCard } from './PaymentMethodsCard';

export function PlanSettingsPage() {
  const vm = usePlanSettingsViewModel();

  if (vm.isLoading) {
    return <p className="text-muted-foreground text-sm">Loading your plan…</p>;
  }
  if (!vm.overview) {
    return <EmptyState title="The plan could not be loaded" description={vm.error?.message} />;
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
              {overview.autoDebit ? 'Turn off automatic debit' : 'Turn on automatic debit'}
            </Button>
            <Button variant="outline" onClick={vm.payments.openManual}>
              Register a payment
            </Button>
            {!overview.isCancelled && (
              <Button variant="ghost" onClick={vm.requestCancel}>
                Cancel subscription
              </Button>
            )}
          </div>
        </CardHeader>
        {overview.needsAction && (
          <CardContent>
            <p className="flex items-center gap-2 text-destructive text-sm" role="alert">
              <AlertTriangle className="size-4" />
              Your access is restricted. Choose a plan and pay, or register a payment, to use the
              practice again. Your data is safe.
            </p>
          </CardContent>
        )}
      </Card>

      <section className="grid gap-3">
        <h2 className="font-semibold">Plans</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {vm.plans.map((plan) => (
            <Card key={plan.id} className={plan.isCurrent ? 'border-primary' : undefined}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {plan.isCurrent && (
                    <Badge variant="secondary">
                      <Check className="size-3" /> Current
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
                  {plan.isCurrent && !overview.hasAccess ? 'Pay and reactivate' : 'Choose'}
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
        title={`Choose the ${vm.pendingPlan?.option.name ?? ''} plan`}
        description={
          vm.pendingPlan?.chargesNow ? (
            <p>
              We will charge {vm.pendingPlan.option.priceLabel} to your default card now and your
              access will be restored immediately.
            </p>
          ) : (
            <p>
              {vm.pendingPlan?.option.priceLabel}. The new plan applies from your next renewal; your
              current period does not change.
            </p>
          )
        }
        confirmLabel={vm.pendingPlan?.chargesNow ? 'Pay now' : 'Confirm plan'}
        busy={vm.isSaving}
        onConfirm={() => void vm.confirmPlan()}
        onCancel={vm.abortPlan}
      />
      <ConfirmDialog
        open={vm.pendingAutoDebit !== null}
        title={vm.pendingAutoDebit ? 'Turn on automatic debit' : 'Turn off automatic debit'}
        description={
          vm.pendingAutoDebit ? (
            <p>Each renewal will be charged to your default card on the renewal date.</p>
          ) : (
            <p>Renewals will not be charged. You will have to pay manually before access ends.</p>
          )
        }
        confirmLabel="Confirm"
        busy={vm.isSaving}
        onConfirm={() => void vm.confirmAutoDebit()}
        onCancel={vm.abortAutoDebit}
      />
      <ConfirmDialog
        open={vm.isCancelling}
        destructive
        title="Cancel your subscription?"
        description={
          <>
            <p>The subscription will not renew and automatic debit will be turned off.</p>
            <p>
              You keep access until the end of the period already paid. After that, only this page
              will be available until you choose a plan again. Your data is not deleted.
            </p>
          </>
        }
        confirmLabel="Cancel subscription"
        cancelLabel="Keep it"
        busy={vm.isSaving}
        onConfirm={() => void vm.confirmCancel()}
        onCancel={vm.abortCancel}
      />
    </div>
  );
}
