import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGO_URI: z.string().min(1).default('mongodb://localhost:27017/mentora'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * Singleton (ADR-0006): validated, immutable process configuration. Parsing happens once,
 * on first access, so a bad environment fails fast at boot.
 */
export class AppConfig {
  static #instance: AppConfig | undefined;

  private constructor(readonly env: Readonly<Env>) {}

  static getInstance(): AppConfig {
    AppConfig.#instance ??= new AppConfig(Object.freeze(EnvSchema.parse(process.env)));
    return AppConfig.#instance;
  }

  /** Test-only: forget the cached instance so the next access re-reads `process.env`. */
  static resetInstance(): void {
    AppConfig.#instance = undefined;
  }

  get isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }
}
