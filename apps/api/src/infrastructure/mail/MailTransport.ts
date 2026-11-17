export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

export abstract class MailTransport {
  abstract send(message: MailMessage): Promise<void>;
}
