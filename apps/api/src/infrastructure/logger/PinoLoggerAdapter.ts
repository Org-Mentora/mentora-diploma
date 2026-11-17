import type { Logger as PinoLogger } from 'pino';
import type { AppLogger } from '#core/logging/AppLogger';

// Adapter
export class PinoLoggerAdapter implements AppLogger {
  constructor(private readonly pino: PinoLogger) {}

  debug(message: string, context: Record<string, unknown> = {}): void {
    this.pino.debug(context, message);
  }

  info(message: string, context: Record<string, unknown> = {}): void {
    this.pino.info(context, message);
  }

  warn(message: string, context: Record<string, unknown> = {}): void {
    this.pino.warn(context, message);
  }

  error(message: string, context: Record<string, unknown> = {}): void {
    this.pino.error(context, message);
  }

  child(bindings: Record<string, unknown>): AppLogger {
    return new PinoLoggerAdapter(this.pino.child(bindings));
  }

  get native(): PinoLogger {
    return this.pino;
  }
}
