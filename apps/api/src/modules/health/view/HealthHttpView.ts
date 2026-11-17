import { HttpView } from '#core/view/HttpView';
import type { HealthDto } from '../contracts/health.contracts';

// Passive View
export class HealthHttpView extends HttpView<HealthDto> {}
