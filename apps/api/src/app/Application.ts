import type { AppModule } from '#core/module/AppModule';
import { AppConfig } from '#infrastructure/config/AppConfig';
import { ExpressServer } from '#infrastructure/http/ExpressServer';
import { Logger } from '#infrastructure/logger/Logger';
import { OpenApiRegistry } from '#infrastructure/openapi/OpenApiRegistry';
import packageJson from '../../package.json' with { type: 'json' };
import { createModules } from './modules';

/** Application composition root: modules + contracts + HTTP server. */
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

  createServer(options: { quiet?: boolean } = {}): ExpressServer {
    return new ExpressServer({
      modules: this.modules,
      logger: Logger.getInstance(),
      corsOrigin: AppConfig.getInstance().env.CORS_ORIGIN,
      openApiDocument: this.openApiDocument,
      quiet: options.quiet ?? false,
    });
  }
}
