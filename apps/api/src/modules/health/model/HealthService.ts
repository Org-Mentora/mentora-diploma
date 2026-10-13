import type { Clock } from '#core/model/Clock';
import { ComponentHealth } from './ComponentHealth';
import type { HealthIndicator } from './HealthIndicator';
import { HealthReport } from './HealthReport';

export interface UptimeSource {
  uptimeSeconds(): number;
}

/** Model service: runs every indicator and builds a `HealthReport`. */
export class HealthService {
  constructor(
    private readonly indicators: readonly HealthIndicator[],
    private readonly clock: Clock,
    private readonly uptime: UptimeSource,
  ) {}

  async getReport(): Promise<HealthReport> {
    const components = await Promise.all(
      this.indicators.map((indicator) => this.safeCheck(indicator)),
    );
    return HealthReport.create({
      components,
      uptimeSeconds: this.uptime.uptimeSeconds(),
      checkedAt: this.clock.now(),
    });
  }

  private async safeCheck(indicator: HealthIndicator): Promise<ComponentHealth> {
    try {
      return await indicator.check();
    } catch (error) {
      return ComponentHealth.down(
        indicator.name,
        error instanceof Error ? error.message : 'unknown',
      );
    }
  }
}
