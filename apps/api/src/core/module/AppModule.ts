import type { Router } from 'express';
import type { ContractRegistry } from './ContractRegistry';

/**
 * A feature module's composition root. It wires Model, Presenters and Views together,
 * declares its API contracts and exposes an Express router mounted under `/api{basePath}`.
 */
export interface AppModule {
  readonly basePath: string;
  registerContracts(registry: ContractRegistry): void;
  createRouter(): Router;
  /** Optional one-off work after the database connects (e.g. seeding reference data). */
  onBootstrap?(): Promise<void>;
}
