import { pino } from 'pino';
import { AppConfig } from '#infrastructure/config/AppConfig';
import { PinoLoggerAdapter } from './PinoLoggerAdapter';

// Singleton
export class Logger {
  static readonly REDACTED_PATHS = [
    'req.headers.cookie',
    'req.headers.authorization',
    'res.headers["set-cookie"]',
  ];
  static #instance: PinoLoggerAdapter | undefined;

  private constructor() {}

  static getInstance(): PinoLoggerAdapter {
    if (!Logger.#instance) {
      const { env } = AppConfig.getInstance();
      const usePretty = env.NODE_ENV === 'development';
      Logger.#instance = new PinoLoggerAdapter(
        pino({
          level: env.LOG_LEVEL,
          redact: Logger.REDACTED_PATHS,
          ...(usePretty
            ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
            : {}),
        }),
      );
    }
    return Logger.#instance;
  }

  static resetInstance(): void {
    Logger.#instance = undefined;
  }
}
