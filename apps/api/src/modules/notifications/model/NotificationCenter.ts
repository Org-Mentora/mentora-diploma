import type { Clock } from '#core/model/Clock';
import type { IdGenerator } from '#core/model/IdGenerator';
import type { Page, PageRequest } from '#core/model/Pagination';
import type { EmailGateway } from './EmailGateway';
import {
  Notification,
  type NotificationChannel,
  type NotificationStatus,
  type NotificationTopic,
} from './Notification';
import type { NotificationRepository } from './NotificationRepository';
import { WhatsAppDeliveryError, type WhatsAppGateway } from './WhatsAppGateway';

export interface PatientMessage {
  professionalId: string;
  patientId: string;
  phone: string | null;
  email: string | null;
  topic: NotificationTopic;
  body: string;
}

export interface DeliveryOutcome {
  channel: NotificationChannel;
  status: NotificationStatus;
  error: string | null;
}

interface Attempt {
  status: NotificationStatus;
  attempts: number;
  providerMessageId: string | null;
  error: string | null;
}

const MAX_ATTEMPTS = 2;

const SUBJECT: Record<NotificationTopic, string> = {
  appointment_scheduled: 'Your appointment is confirmed',
  appointment_rescheduled: 'Your appointment was rescheduled',
  appointment_cancelled: 'Your appointment was cancelled',
  appointment_reminder: 'Appointment reminder',
  virtual_meeting: 'Your video consultation link',
};

// Facade
export class NotificationCenter {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly whatsapp: WhatsAppGateway,
    private readonly email: EmailGateway,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async send(message: PatientMessage): Promise<DeliveryOutcome> {
    const phone = message.phone?.trim() || null;
    const email = message.email?.trim() || null;
    if (phone) {
      const outcome = await this.log(
        message,
        'whatsapp',
        phone,
        await this.viaWhatsApp(phone, message),
      );
      if (outcome.status === 'sent' || !email) {
        return outcome;
      }
    }
    if (email) {
      return this.log(message, 'email', email, await this.viaEmail(email, message));
    }
    return this.log(message, 'whatsapp', null, {
      status: 'skipped',
      attempts: 0,
      providerMessageId: null,
      error: 'The patient has no phone number or email',
    });
  }

  history(
    professionalId: string,
    patientId: string,
    page: PageRequest,
  ): Promise<Page<Notification>> {
    return this.notifications.findByPatient(professionalId, patientId, page);
  }

  private async viaWhatsApp(phone: string, message: PatientMessage): Promise<Attempt> {
    let error: string | null = null;
    for (let attempts = 1; attempts <= MAX_ATTEMPTS; attempts++) {
      try {
        const providerMessageId = await this.whatsapp.send(phone, message.body);
        return { status: 'sent', attempts, providerMessageId, error: null };
      } catch (caught) {
        error = NotificationCenter.reason(caught);
        if (
          (caught instanceof WhatsAppDeliveryError && caught.permanent) ||
          attempts === MAX_ATTEMPTS
        ) {
          return { status: 'failed', attempts, providerMessageId: null, error };
        }
      }
    }
    return { status: 'failed', attempts: MAX_ATTEMPTS, providerMessageId: null, error };
  }

  private async viaEmail(email: string, message: PatientMessage): Promise<Attempt> {
    try {
      await this.email.send(email, SUBJECT[message.topic], message.body);
      return { status: 'sent', attempts: 1, providerMessageId: null, error: null };
    } catch (caught) {
      return {
        status: 'failed',
        attempts: 1,
        providerMessageId: null,
        error: NotificationCenter.reason(caught),
      };
    }
  }

  private async log(
    message: PatientMessage,
    channel: NotificationChannel,
    recipient: string | null,
    attempt: Attempt,
  ): Promise<DeliveryOutcome> {
    await this.notifications.save(
      Notification.record(this.ids.next(), {
        professionalId: message.professionalId,
        patientId: message.patientId,
        channel,
        topic: message.topic,
        recipient,
        body: message.body,
        ...attempt,
        createdAt: this.clock.now(),
      }),
    );
    return { channel, status: attempt.status, error: attempt.error };
  }

  private static reason(caught: unknown): string {
    return caught instanceof Error ? caught.message : 'Unknown delivery error';
  }
}
