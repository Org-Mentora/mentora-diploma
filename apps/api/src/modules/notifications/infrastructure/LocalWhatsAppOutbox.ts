import type { AppLogger } from '#core/logging/AppLogger';
import { WhatsAppDeliveryError, WhatsAppGateway } from '../model/WhatsAppGateway';

// Adapter
export class LocalWhatsAppOutbox extends WhatsAppGateway {
  constructor(private readonly logger: AppLogger) {
    super();
  }

  async send(to: string, body: string): Promise<string> {
    const digits = to.replace(/\D/g, '');
    if (digits.length < 8) {
      throw new WhatsAppDeliveryError(`'${to}' is not a valid WhatsApp number`, true);
    }
    const messageId = `local-${crypto.randomUUID()}`;
    this.logger.info('WhatsApp message (local outbox)', { to, messageId, body });
    return messageId;
  }
}
