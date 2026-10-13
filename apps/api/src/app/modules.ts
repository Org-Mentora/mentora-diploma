import type { AppModule } from '#core/module/AppModule';
import { HealthModule } from '#modules/health';

/** Every feature module of the API. Register new modules here (see docs/guides). */
export function createModules(): AppModule[] {
  return [new HealthModule()];
}
