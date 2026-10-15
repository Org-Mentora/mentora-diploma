/** Public API of the health module. Other modules may only import from here. */
export type { ComponentHealthDto, HealthDto } from './contracts/health.contracts';
export { HealthModule, type HealthModuleDependencies } from './HealthModule';
export { MongoHealthIndicator } from './infrastructure/MongoHealthIndicator';
