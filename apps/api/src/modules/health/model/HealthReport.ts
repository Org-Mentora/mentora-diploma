import { ValueObject } from '#core/model/ValueObject';
import type { ComponentHealth } from './ComponentHealth';

export type OverallStatus = 'ok' | 'degraded';

interface HealthReportProps {
  components: ComponentHealth[];
  uptimeSeconds: number;
  checkedAt: Date;
}

/** Aggregated health of the service. The overall status is a business rule of the Model. */
export class HealthReport extends ValueObject<HealthReportProps> {
  static create(props: HealthReportProps): HealthReport {
    return new HealthReport(props);
  }

  get status(): OverallStatus {
    return this.props.components.every((component) => component.isUp) ? 'ok' : 'degraded';
  }

  get components(): readonly ComponentHealth[] {
    return this.props.components;
  }

  get uptimeSeconds(): number {
    return this.props.uptimeSeconds;
  }

  get checkedAt(): Date {
    return this.props.checkedAt;
  }
}
