import { HttpView } from '#core/view/HttpView';
import type { HealthDto } from '../contracts/health.contracts';

/** Passive view: writes the health view model as JSON. */
export class HealthHttpView extends HttpView<HealthDto> {}
