import { Clock } from '#core/model/Clock';
import type { ErrorViewModel, View } from '#core/view/View';
import { type MailMessage, MailTransport } from '#infrastructure/mail/MailTransport';
import { WhatsAppDeliveryError, WhatsAppGateway } from '#modules/notifications';
import { ComponentHealth } from '../../src/modules/health/model/ComponentHealth';
import { HealthIndicator } from '../../src/modules/health/model/HealthIndicator';
import type { UptimeSource } from '../../src/modules/health/model/HealthService';

export class FixedClock extends Clock {
  constructor(private readonly date: Date) {
    super();
  }

  now(): Date {
    return this.date;
  }
}

export class FixedUptime implements UptimeSource {
  constructor(private readonly seconds: number) {}

  uptimeSeconds(): number {
    return this.seconds;
  }
}

export class StubIndicator extends HealthIndicator {
  constructor(
    readonly name: string,
    private readonly outcome: 'up' | 'down' | 'throw',
  ) {
    super();
  }

  async check(): Promise<ComponentHealth> {
    if (this.outcome === 'throw') {
      throw new Error(`${this.name} unreachable`);
    }
    return this.outcome === 'up'
      ? ComponentHealth.up(this.name, 5)
      : ComponentHealth.down(this.name, 'stub down');
  }
}

export class SpyView<T> implements View<T> {
  rendered: T | undefined;
  error: ErrorViewModel | undefined;

  render(viewModel: T): void {
    this.rendered = viewModel;
  }

  renderError(error: ErrorViewModel): void {
    this.error = error;
  }
}

export class CapturingMailTransport extends MailTransport {
  readonly sent: MailMessage[] = [];

  async send(message: MailMessage): Promise<void> {
    this.sent.push(message);
  }

  lastTo(email: string): MailMessage | undefined {
    return this.sent.filter((m) => m.to === email).at(-1);
  }

  recoveryCodeFor(email: string): string {
    const match = /code[^\d]*(\d{6})/i.exec(this.lastTo(email)?.subject ?? '');
    if (!match?.[1]) {
      throw new Error(`No recovery email for ${email}`);
    }
    return match[1];
  }
}

export class RecordingWhatsApp extends WhatsAppGateway {
  readonly sent: { to: string; body: string }[] = [];
  #failures: WhatsAppDeliveryError[] = [];

  failNext(count: number, permanent = false): void {
    for (let i = 0; i < count; i += 1) {
      this.#failures.push(new WhatsAppDeliveryError('provider error', permanent));
    }
  }

  async send(to: string, body: string): Promise<string> {
    const failure = this.#failures.shift();
    if (failure) {
      throw failure;
    }
    this.sent.push({ to, body });
    return `test-${this.sent.length}`;
  }
}
