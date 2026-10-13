import { pino } from 'pino';
import { AppConfig } from '#infrastructure/config/AppConfig';
import { PinoLoggerAdapter } from './PinoLoggerAdapter';

/** Singleton (ADR-0006): the process-wide logger, configured from `AppConfig`. */
export class Logger {
  static #instance: PinoLoggerAdapter | undefined;

  private constructor() {}

  static getInstance(): PinoLoggerAdapter {
    if (!Logger.#instance) {
      const { env } = AppConfig.getInstance();
      const usePretty = env.NODE_ENV === 'development';
      Logger.#instance = new PinoLoggerAdapter(
        pino({
          level: env.LOG_LEVEL,
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
