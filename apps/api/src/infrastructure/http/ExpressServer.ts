import type { Server } from 'node:http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import type { AppModule } from '#core/module/AppModule';
import type { PinoLoggerAdapter } from '#infrastructure/logger/PinoLoggerAdapter';
import { HttpErrorHandler } from './HttpErrorHandler';

export interface ExpressServerOptions {
  modules: AppModule[];
  logger: PinoLoggerAdapter;
  corsOrigin: string;
  openApiDocument: object;
  /** Disable request logging (tests). */
  quiet?: boolean;
}

/** Builds the Express application: global middleware, module routers, docs and errors. */
export class ExpressServer {
  readonly app: Express;

  constructor(private readonly options: ExpressServerOptions) {
    this.app = this.build();
  }

  listen(port: number): Promise<Server> {
    return new Promise((resolve) => {
      const server = this.app.listen(port, () => resolve(server));
    });
  }

  private build(): Express {
    const { modules, logger, corsOrigin, openApiDocument, quiet } = this.options;
    const app = express();
    const errors = new HttpErrorHandler(logger);

    app.disable('x-powered-by');
    app.use(helmet({ contentSecurityPolicy: false }));
    app.use(cors({ origin: corsOrigin.split(','), credentials: true }));
    app.use(express.json({ limit: '1mb' }));
    app.use(cookieParser());
    if (!quiet) {
      app.use(pinoHttp({ logger: logger.native }));
    }

    app.get('/api/openapi.json', (_req, res) => {
      res.json(openApiDocument);
    });
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

    for (const module of modules) {
      app.use(`/api${module.basePath}`, module.createRouter());
    }

    app.use(errors.notFound);
    app.use(errors.handle);
    return app;
  }
}
