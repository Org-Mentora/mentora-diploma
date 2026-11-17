import type { SessionDto } from '@mentora/contracts';

export type SubscriptionTone = 'success' | 'warning' | 'danger';
export type SubscriptionStatus = SessionDto['subscription']['status'];

export interface SessionUiModel {
  professionalName: string;
  initials: string;
  specialty: string;
  hasAccess: boolean;
  status: SubscriptionStatus;
  subscriptionLabel: string;
  subscriptionTone: SubscriptionTone;
}

const plural = (days: number) => `${days} day${days === 1 ? '' : 's'}`;

// Adapter
export class SessionAdapter {
  static toUiModel(dto: SessionDto): SessionUiModel {
    const { professional, subscription } = dto;
    return {
      professionalName: professional.fullName,
      initials: `${professional.firstName[0] ?? ''}${professional.lastName[0] ?? ''}`.toUpperCase(),
      specialty: professional.specialty,
      hasAccess: subscription.hasAccess,
      status: subscription.status,
      ...SessionAdapter.subscription(subscription),
    };
  }

  static subscription(
    subscription: SessionDto['subscription'],
  ): Pick<SessionUiModel, 'subscriptionLabel' | 'subscriptionTone'> {
    const days = subscription.daysLeft;
    switch (subscription.status) {
      case 'trial':
        return {
          subscriptionLabel: `Free trial · ${plural(days)} left`,
          subscriptionTone: days <= 3 ? 'warning' : 'success',
        };
      case 'active':
        return { subscriptionLabel: 'Active plan', subscriptionTone: 'success' };
      case 'cancelled':
        return subscription.hasAccess
          ? { subscriptionLabel: `Cancelled · ${plural(days)} left`, subscriptionTone: 'warning' }
          : { subscriptionLabel: 'Subscription cancelled', subscriptionTone: 'danger' };
      case 'pending_payment':
        return { subscriptionLabel: 'Payment pending', subscriptionTone: 'danger' };
      case 'suspended':
        return { subscriptionLabel: 'Subscription suspended', subscriptionTone: 'danger' };
      default:
        return { subscriptionLabel: 'Subscription expired', subscriptionTone: 'danger' };
    }
  }
}
