import type { MailTransport } from '#infrastructure/mail/MailTransport';
import { EmailGateway } from '../model/EmailGateway';

// Adapter
export class MailEmailGateway extends EmailGateway {
  constructor(private readonly mail: MailTransport) {
    super();
  }

  send(to: string, subject: string, body: string): Promise<void> {
    return this.mail.send({ to, subject, text: body });
  }
}
