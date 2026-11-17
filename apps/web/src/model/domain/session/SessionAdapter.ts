import type { SessionDto } from '@mentora/contracts';
import { translate as t } from '@/shared/i18n';

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
          subscriptionLabel: t('session.trial', { count: days }),
          subscriptionTone: days <= 3 ? 'warning' : 'success',
        };
      case 'active':
        return { subscriptionLabel: t('session.active'), subscriptionTone: 'success' };
      case 'cancelled':
        return subscription.hasAccess
          ? {
              subscriptionLabel: t('session.cancelledLeft', { count: days }),
              subscriptionTone: 'warning',
            }
          : { subscriptionLabel: t('session.cancelled'), subscriptionTone: 'danger' };
      case 'pending_payment':
        return { subscriptionLabel: t('session.pending'), subscriptionTone: 'danger' };
      case 'suspended':
        return { subscriptionLabel: t('session.suspended'), subscriptionTone: 'danger' };
      default:
        return { subscriptionLabel: t('session.expired'), subscriptionTone: 'danger' };
    }
  }
}
