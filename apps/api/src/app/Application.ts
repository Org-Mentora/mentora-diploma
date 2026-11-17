import type { AppModule } from '#core/module/AppModule';
import type { ScheduledJob } from '#core/scheduling/ScheduledJob';
import { AppConfig } from '#infrastructure/config/AppConfig';
import { MigrationLog } from '#infrastructure/database/MigrationLog';
import { ExpressServer } from '#infrastructure/http/ExpressServer';
import { Logger } from '#infrastructure/logger/Logger';
import { OpenApiRegistry } from '#infrastructure/openapi/OpenApiRegistry';
import packageJson from '../../package.json' with { type: 'json' };
import { createModules } from './modules';

// Composition Root
export class Application {
  #openApiDocument: object | undefined;

  constructor(private readonly modules: AppModule[] = createModules()) {}

  get openApiDocument(): object {
    if (!this.#openApiDocument) {
      const registry = OpenApiRegistry.getInstance();
      for (const module of this.modules) {
        module.registerContracts(registry);
      }
      this.#openApiDocument = registry.generateDocument(packageJson.version);
    }
    return this.#openApiDocument;
  }

  async bootstrapModules(): Promise<void> {
    for (const module of this.modules) {
      await module.onBootstrap?.();
    }
  }

  async runMigrations(log: MigrationLog = new MigrationLog()): Promise<string[]> {
    const ran: string[] = [];
    for (const migration of this.modules.flatMap((module) => module.migrations?.() ?? [])) {
      if (await log.runOnce(migration.name, () => migration.run())) {
        ran.push(migration.name);
      }
    }
    return ran;
  }

  scheduledJobs(): ScheduledJob[] {
    return this.modules.flatMap((module) => module.scheduledJobs?.() ?? []);
  }

  createServer(options: { quiet?: boolean } = {}): ExpressServer {
    return new ExpressServer({
      modules: this.modules,
      logger: Logger.getInstance(),
      corsOrigin: AppConfig.getInstance().env.CORS_ORIGIN,
      openApiDocument: this.openApiDocument,
      quiet: options.quiet ?? false,
      trustProxy: AppConfig.getInstance().env.TRUST_PROXY,
    });
  }
}
