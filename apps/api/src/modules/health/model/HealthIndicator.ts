import type { ComponentHealth } from './ComponentHealth';

export abstract class HealthIndicator {
  abstract readonly name: string;
  abstract check(): Promise<ComponentHealth>;
}
