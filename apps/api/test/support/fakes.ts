import { Clock } from '#core/model/Clock';
import type { ErrorViewModel, View } from '#core/view/View';
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

/** Records what a Presenter asked it to render. */
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
