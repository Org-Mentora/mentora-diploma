import nodemailer, { type Transporter } from 'nodemailer';
import { type MailMessage, MailTransport } from './MailTransport';

const TIMEOUT_MS = 10_000;

// Adapter
export class SmtpMailTransport extends MailTransport {
  readonly #transporter: Transporter;

  constructor(
    smtpUrl: string,
    private readonly from: string,
  ) {
    super();
    this.#transporter = nodemailer.createTransport({
      url: smtpUrl,
      connectionTimeout: TIMEOUT_MS,
      greetingTimeout: TIMEOUT_MS,
      socketTimeout: TIMEOUT_MS,
    });
  }

  async send(message: MailMessage): Promise<void> {
    await this.#transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
  }
}
