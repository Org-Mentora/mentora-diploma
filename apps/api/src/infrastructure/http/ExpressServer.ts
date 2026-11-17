import { randomUUID } from 'node:crypto';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
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
  quiet?: boolean;
  trustProxy?: number;
}

const REQUEST_ID = /^[\w.-]{1,100}$/;

function requestIdOf(req: IncomingMessage, res: ServerResponse): string {
  const incoming = req.headers['x-request-id'];
  const id = typeof incoming === 'string' && REQUEST_ID.test(incoming) ? incoming : randomUUID();
  res.setHeader('X-Request-Id', id);
  return id;
}

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
    const { modules, logger, corsOrigin, openApiDocument, quiet, trustProxy = 0 } = this.options;
    const app = express();
    const errors = new HttpErrorHandler(logger);

    app.disable('x-powered-by');
    app.set('trust proxy', trustProxy);
    app.use((req, res, next) => {
      requestIdOf(req, res);
      next();
    });
    app.use(helmet({ contentSecurityPolicy: false }));
    app.use(
      cors({ origin: corsOrigin.split(',').map((origin) => origin.trim()), credentials: true }),
    );
    app.use(express.json({ limit: '1mb' }));
    app.use(cookieParser());
    if (!quiet) {
      app.use(
        pinoHttp({
          logger: logger.native,
          genReqId: (_req, res) => String(res.getHeader('X-Request-Id') ?? randomUUID()),
        }),
      );
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
