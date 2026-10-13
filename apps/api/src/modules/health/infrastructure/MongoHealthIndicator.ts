import type { MongoConnection } from '#infrastructure/database/MongoConnection';
import { ComponentHealth } from '../model/ComponentHealth';
import { HealthIndicator } from '../model/HealthIndicator';

/** Adapter (ADR-0007): exposes the Mongo connection singleton as a `HealthIndicator`. */
export class MongoHealthIndicator extends HealthIndicator {
  readonly name = 'mongodb';

  constructor(private readonly connection: MongoConnection) {
    super();
  }

  async check(): Promise<ComponentHealth> {
    const latencyMs = await this.connection.ping();
    return ComponentHealth.up(this.name, latencyMs);
  }
}
