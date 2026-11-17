import { Entity } from '#core/model/Entity';

export type NotificationTopic =
  | 'appointment_scheduled'
  | 'appointment_rescheduled'
  | 'appointment_cancelled'
  | 'appointment_reminder'
  | 'virtual_meeting';
export type NotificationStatus = 'sent' | 'failed' | 'skipped';

export interface NotificationProps {
  professionalId: string;
  patientId: string;
  channel: 'whatsapp';
  topic: NotificationTopic;
  recipient: string | null;
  body: string;
  status: NotificationStatus;
  attempts: number;
  providerMessageId: string | null;
  error: string | null;
  createdAt: Date;
}

// Aggregate Root
export class Notification extends Entity<NotificationProps> {
  static record(props: Omit<NotificationProps, 'channel'>): Notification {
    return new Notification(crypto.randomUUID(), { ...props, channel: 'whatsapp' });
  }

  static restore(id: string, props: NotificationProps): Notification {
    return new Notification(id, props);
  }

  get professionalId(): string {
    return this.props.professionalId;
  }

  get patientId(): string {
    return this.props.patientId;
  }

  get channel(): 'whatsapp' {
    return this.props.channel;
  }

  get topic(): NotificationTopic {
    return this.props.topic;
  }

  get recipient(): string | null {
    return this.props.recipient;
  }

  get body(): string {
    return this.props.body;
  }

  get status(): NotificationStatus {
    return this.props.status;
  }

  get attempts(): number {
    return this.props.attempts;
  }

  get providerMessageId(): string | null {
    return this.props.providerMessageId;
  }

  get error(): string | null {
    return this.props.error;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
