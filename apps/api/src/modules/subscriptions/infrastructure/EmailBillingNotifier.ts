import type { DateFormatter } from '#core/format/DateFormatter';
import type { AppLogger } from '#core/logging/AppLogger';
import type { MailTransport } from '#infrastructure/mail/MailTransport';
import { type BillingEvent, BillingNotifier } from '../model/BillingNotifier';
import type { BillingContact } from '../model/Subscription';

// Adapter
export class EmailBillingNotifier extends BillingNotifier {
  constructor(
    private readonly mail: MailTransport,
    private readonly dates: DateFormatter,
    private readonly planUrl: string,
    private readonly logger: AppLogger,
  ) {
    super();
  }

  async notify(contact: BillingContact, event: BillingEvent): Promise<void> {
    const { subject, body } = this.compose(event);
    try {
      await this.mail.send({
        to: contact.email,
        subject: `Mentora · ${subject}`,
        text: `Hello ${contact.name},\n\n${body}\n\nManage your plan: ${this.planUrl}\n\nThe Mentora team`,
      });
    } catch (error) {
      this.logger.warn('Billing email could not be sent', { event: event.type, err: error });
      throw error;
    }
  }

  private compose(event: BillingEvent): { subject: string; body: string } {
    switch (event.type) {
      case 'trial_expired':
        return {
          subject: 'Your free trial has ended',
          body: 'Your free trial has ended. Your data is safe: choose a plan to keep using Mentora.',
        };
      case 'payment_pending':
        return {
          subject: 'Your subscription is pending payment',
          body: `We could not renew your subscription because ${event.reason}. Add a payment method or register a payment to restore access.`,
        };
      case 'payment_declined':
        return {
          subject: 'Your payment was declined',
          body: `The automatic charge for your subscription was declined (${event.reason}). Update your payment method to restore access.`,
        };
      case 'suspended':
        return {
          subject: 'Your subscription was suspended',
          body: `We could not charge your subscription after several attempts (${event.reason}). Your access is suspended until the payment is regularized.`,
        };
      case 'renewed':
        return {
          subject: 'Your subscription was renewed',
          body: `We charged ${event.amount} ${event.currency} for the ${event.planName} plan. Your access is renewed until ${this.dates.date(event.periodEndsAt)}.`,
        };
    }
  }
}
