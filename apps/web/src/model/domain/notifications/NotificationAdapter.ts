import type { NotificationDto } from '@mentora/contracts';
import { translate as t } from '@/shared/i18n';
import { Formats } from '../format/Formats';

export type DeliveryTone = 'success' | 'warning' | 'danger' | 'secondary';

export interface NotificationItem {
  id: string;
  when: string;
  topicLabel: string;
  channelLabel: string;
  body: string;
  recipient: string;
  statusLabel: string;
  statusTone: DeliveryTone;
  detail: string | null;
}

const TONE: Record<NotificationDto['status'], DeliveryTone> = {
  sent: 'success',
  failed: 'danger',
  skipped: 'secondary',
};

// Adapter
export class NotificationAdapter {
  static toItem(dto: NotificationDto): NotificationItem {
    const attempts =
      dto.attempts > 1 ? ` (${t('notifications.attempts', { count: dto.attempts })})` : '';
    return {
      id: dto.id,
      when: Formats.date(dto.createdAt, 'shortDateTime'),
      topicLabel: t(`notifications.topic.${dto.topic}`),
      channelLabel: t(`notifications.channel.${dto.channel}`),
      body: dto.body,
      recipient: dto.recipient ?? t('notifications.noRecipient'),
      statusLabel: t(`notifications.status.${dto.status}`),
      statusTone: TONE[dto.status],
      detail: dto.error ? `${dto.error}${attempts}` : attempts.trim() || null,
    };
  }
}
