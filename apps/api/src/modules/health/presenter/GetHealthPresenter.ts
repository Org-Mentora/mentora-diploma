import { Presenter } from '#core/presenter/Presenter';
import type { View } from '#core/view/View';
import type { HealthDto } from '../contracts/health.contracts';
import type { HealthScope, HealthService } from '../model/HealthService';

// Presenter
export class GetHealthPresenter extends Presenter<void, HealthDto> {
  constructor(
    view: View<HealthDto>,
    private readonly service: HealthService,
    private readonly scope: HealthScope = 'dependencies',
  ) {
    super(view);
  }

  protected async execute(): Promise<HealthDto> {
    const report = await this.service.getReport(this.scope);
    return {
      status: report.status,
      uptimeSeconds: report.uptimeSeconds,
      checkedAt: report.checkedAt.toISOString(),
      components: report.components.map((component) => ({
        name: component.name,
        status: component.status,
        latencyMs: component.latencyMs,
        error: component.error,
      })),
    };
  }
}
