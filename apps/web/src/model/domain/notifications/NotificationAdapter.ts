import type { NotificationDto } from '@mentora/contracts';

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

const TOPIC: Record<NotificationDto['topic'], string> = {
  appointment_scheduled: 'Appointment confirmed',
  appointment_rescheduled: 'Appointment rescheduled',
  appointment_cancelled: 'Appointment cancelled',
  appointment_reminder: 'Reminder',
  virtual_meeting: 'Video call link',
};

const CHANNEL: Record<NotificationDto['channel'], string> = {
  whatsapp: 'WhatsApp',
  email: 'Email',
};

const STATUS: Record<NotificationDto['status'], { label: string; tone: DeliveryTone }> = {
  sent: { label: 'Sent', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  skipped: { label: 'Not sent', tone: 'secondary' },
};

const dateTime = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

// Adapter
export class NotificationAdapter {
  static toItem(dto: NotificationDto): NotificationItem {
    const attempts = dto.attempts > 1 ? ` (${dto.attempts} attempts)` : '';
    return {
      id: dto.id,
      when: dateTime.format(new Date(dto.createdAt)),
      topicLabel: TOPIC[dto.topic],
      channelLabel: CHANNEL[dto.channel],
      body: dto.body,
      recipient: dto.recipient ?? 'No phone or email',
      statusLabel: STATUS[dto.status].label,
      statusTone: STATUS[dto.status].tone,
      detail: dto.error ? `${dto.error}${attempts}` : attempts.trim() || null,
    };
  }
}
