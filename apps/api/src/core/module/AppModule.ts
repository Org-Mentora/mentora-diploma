import type { RequestHandler, Router } from 'express';
import type { ScheduledJob } from '#core/scheduling/ScheduledJob';
import type { ContractRegistry } from './ContractRegistry';
import type { DataMigration } from './DataMigration';

export interface AppModule {
  readonly basePath: string;
  registerContracts(registry: ContractRegistry): void;
  createRouter(): Router;
  requestHandlers?(): RequestHandler[];
  onBootstrap?(): Promise<void>;
  scheduledJobs?(): ScheduledJob[];
  migrations?(): DataMigration[];
}
