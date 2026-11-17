import type { AppLogger } from '#core/logging/AppLogger';
import type { DateTimeFormatter } from '#infrastructure/format/DateTimeFormatter';
import type { MailTransport } from '#infrastructure/mail/MailTransport';
import {
  PasswordRecoveryNotifier,
  type RecoveryCodeMessage,
} from '../model/PasswordRecoveryNotifier';

// Adapter
export class EmailPasswordRecoveryNotifier extends PasswordRecoveryNotifier {
  constructor(
    private readonly mail: MailTransport,
    private readonly dates: DateTimeFormatter,
    private readonly recoveryUrl: string,
    private readonly logger: AppLogger,
  ) {
    super();
  }

  async sendCode(message: RecoveryCodeMessage): Promise<void> {
    try {
      await this.mail.send({
        to: message.email,
        subject: `Mentora · Your recovery code: ${message.code}`,
        text: [
          `Hello ${message.name},`,
          '',
          `Your code to reset your Mentora password is: ${message.code}`,
          '',
          `It is valid until ${this.dates.time(message.expiresAt)} and can be used only once.`,
          `Enter it at ${this.recoveryUrl}`,
          '',
          'If you did not ask for it, ignore this email: your password does not change.',
        ].join('\n'),
      });
    } catch (error) {
      this.logger.error('Recovery email could not be sent', { err: error });
    }
  }
}
