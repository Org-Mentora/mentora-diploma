import type { ComponentHealth } from './ComponentHealth';

/**
 * Probes one dependency. The Model owns this abstraction; concrete probes are adapters
 * living in `../infrastructure` (e.g. `MongoHealthIndicator`).
 */
export abstract class HealthIndicator {
  abstract readonly name: string;
  abstract check(): Promise<ComponentHealth>;
}
