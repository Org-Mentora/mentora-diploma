import { z } from 'zod';

/** Development-only fallback; production refuses to start with it. */
const DEV_JWT_SECRET = 'dev-only-insecure-jwt-secret-change-me-0123456789';

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    MONGO_URI: z.string().min(1).default('mongodb://localhost:27017/mentora'),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    JWT_SECRET: z.string().min(32).default(DEV_JWT_SECRET),
    SESSION_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(8 * 60 * 60),
    TRIAL_DAYS: z.coerce.number().int().min(0).default(14),
  })
  .refine((env) => env.NODE_ENV !== 'production' || env.JWT_SECRET !== DEV_JWT_SECRET, {
    message: 'JWT_SECRET must be set in production',
    path: ['JWT_SECRET'],
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
