import { HttpView } from '#core/view/HttpView';
import type { HealthDto } from '../contracts/health.contracts';

// Passive View
export class ReadinessHttpView extends HttpView<HealthDto> {
  override render(viewModel: HealthDto): void {
    this.responder.send(viewModel.status === 'ok' ? 200 : 503, viewModel);
  }
}
