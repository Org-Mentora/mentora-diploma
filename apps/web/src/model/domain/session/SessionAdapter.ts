import type { SessionDto } from '@mentora/contracts';

export type SubscriptionTone = 'success' | 'warning' | 'danger';

export interface SessionUiModel {
  professionalName: string;
  initials: string;
  specialty: string;
  isExpired: boolean;
  subscriptionLabel: string;
  subscriptionTone: SubscriptionTone;
}

/** Adapter (ADR-0007): `SessionDto` → what the shell and guards display. */
export class SessionAdapter {
  static toUiModel(dto: SessionDto): SessionUiModel {
    const { professional, subscription } = dto;
    return {
      professionalName: professional.fullName,
      initials: `${professional.firstName[0] ?? ''}${professional.lastName[0] ?? ''}`.toUpperCase(),
      specialty: professional.specialty,
      isExpired: subscription.status === 'expired',
      ...SessionAdapter.subscription(dto.subscription),
    };
  }

  private static subscription(
    subscription: SessionDto['subscription'],
  ): Pick<SessionUiModel, 'subscriptionLabel' | 'subscriptionTone'> {
    switch (subscription.status) {
      case 'trial': {
        const days = subscription.daysLeft ?? 0;
        return {
          subscriptionLabel: `Free trial · ${days} day${days === 1 ? '' : 's'} left`,
          subscriptionTone: days <= 3 ? 'warning' : 'success',
        };
      }
      case 'active':
        return { subscriptionLabel: 'Active plan', subscriptionTone: 'success' };
      default:
        return { subscriptionLabel: 'Subscription expired', subscriptionTone: 'danger' };
    }
  }
}
