import type { DateFormatter } from '#core/format/DateFormatter';
import type { AppLogger } from '#core/logging/AppLogger';
import type { MailTransport } from '#infrastructure/mail/MailTransport';
import { BookingNotifier } from '../model/BookingNotifier';
import type { BookingRequest } from '../model/BookingRequest';

// Adapter
export class EmailBookingNotifier extends BookingNotifier {
  constructor(
    private readonly mail: MailTransport,
    private readonly dates: DateFormatter,
    private readonly logger: AppLogger,
  ) {
    super();
  }

  async rejected(request: BookingRequest, professionalName: string): Promise<void> {
    const email = request.requester.email;
    if (!email) {
      return;
    }
    try {
      await this.mail.send({
        to: email,
        subject: 'Mentora · Your appointment request',
        text: [
          `Hello ${request.requester.firstName},`,
          '',
          `${professionalName} could not accept your request for ${this.dates.dateTime(request.startsAt)}.`,
          request.rejectionReason ? `Reason: ${request.rejectionReason}` : '',
          'You can choose another time on the same booking page.',
        ]
          .filter((line, index, all) => line !== '' || all[index - 1] !== '')
          .join('\n'),
      });
    } catch (error) {
      this.logger.error('Booking rejection email could not be sent', { err: error });
    }
  }
}
