import { Presenter } from '#core/presenter/Presenter';
import type { View } from '#core/view/View';
import type { HealthDto } from '../contracts/health.contracts';
import type { HealthService } from '../model/HealthService';

/** Use case "get service health": Model `HealthReport` → `HealthDto` view model. */
export class GetHealthPresenter extends Presenter<void, HealthDto> {
  constructor(
    view: View<HealthDto>,
    private readonly service: HealthService,
  ) {
    super(view);
  }

  protected async execute(): Promise<HealthDto> {
    const report = await this.service.getReport();
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
