import type { Clock } from '#core/model/Clock';
import { Notification, type NotificationStatus, type NotificationTopic } from './Notification';
import type { NotificationRepository } from './NotificationRepository';
import { WhatsAppDeliveryError, type WhatsAppGateway } from './WhatsAppGateway';

export interface PatientMessage {
  professionalId: string;
  patientId: string;
  phone: string | null;
  topic: NotificationTopic;
  body: string;
}

export interface DeliveryOutcome {
  status: NotificationStatus;
  error: string | null;
}

const MAX_ATTEMPTS = 2;

// Facade
export class NotificationCenter {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly whatsapp: WhatsAppGateway,
    private readonly clock: Clock,
  ) {}

  async sendWhatsApp(message: PatientMessage): Promise<DeliveryOutcome> {
    const recipient = message.phone?.trim() || null;
    let status: NotificationStatus = 'skipped';
    let attempts = 0;
    let providerMessageId: string | null = null;
    let error: string | null = recipient ? null : 'The patient has no phone number';

    if (recipient) {
      while (attempts < MAX_ATTEMPTS) {
        attempts += 1;
        try {
          providerMessageId = await this.whatsapp.send(recipient, message.body);
          status = 'sent';
          error = null;
          break;
        } catch (caught) {
          status = 'failed';
          error = caught instanceof Error ? caught.message : 'Unknown delivery error';
          if (caught instanceof WhatsAppDeliveryError && caught.permanent) {
            break;
          }
        }
      }
    }

    await this.notifications.save(
      Notification.record({
        professionalId: message.professionalId,
        patientId: message.patientId,
        topic: message.topic,
        recipient,
        body: message.body,
        status,
        attempts,
        providerMessageId,
        error,
        createdAt: this.clock.now(),
      }),
    );
    return { status, error };
  }

  history(professionalId: string, patientId: string): Promise<Notification[]> {
    return this.notifications.findByPatient(professionalId, patientId);
  }
}
