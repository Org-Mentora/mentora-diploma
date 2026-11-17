import nodemailer, { type Transporter } from 'nodemailer';
import { type MailMessage, MailTransport } from './MailTransport';

// Adapter
export class SmtpMailTransport extends MailTransport {
  readonly #transporter: Transporter;

  constructor(
    smtpUrl: string,
    private readonly from: string,
  ) {
    super();
    this.#transporter = nodemailer.createTransport(smtpUrl);
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
