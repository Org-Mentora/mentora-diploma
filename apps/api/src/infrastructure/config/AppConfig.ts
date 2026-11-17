import { z } from 'zod';

const DEV_JWT_SECRET = 'dev-only-insecure-jwt-secret-change-me-0123456789';

const flag = (fallback: boolean) =>
  z
    .enum(['true', 'false'])
    .default(fallback ? 'true' : 'false')
    .transform((value) => value === 'true');

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    MONGO_URI: z.string().min(1).default('mongodb://localhost:27017/mentora?directConnection=true'),
    MONGO_MAX_POOL_SIZE: z.coerce.number().int().min(1).max(500).default(20),
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
    APP_URL: z.url().default('http://localhost:5173'),
    APP_TIMEZONE: z.string().default('America/Argentina/Buenos_Aires'),
    SCHEDULER_ENABLED: flag(true),
    RATE_LIMIT_ENABLED: flag(true),
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),
    SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
    SMTP_URL: z.string().min(1).default('smtp://localhost:1025'),
    MAIL_FROM: z.string().min(3).default('Mentora <no-reply@mentora.local>'),
    WHATSAPP_PROVIDER: z.enum(['local', 'cloud-api']).default('local'),
    WHATSAPP_TOKEN: z.string().optional(),
    WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
    WHATSAPP_API_VERSION: z.string().default('v21.0'),
    MEETING_PROVIDER: z.enum(['jitsi', 'google-meet']).default('jitsi'),
    JITSI_BASE_URL: z.url().default('https://meet.jit.si'),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_REFRESH_TOKEN: z.string().optional(),
    GOOGLE_CALENDAR_ID: z.string().default('primary'),
    PLAN_MONTHLY_PRICE: z.coerce.number().positive().default(25_000),
    PLAN_ANNUAL_PRICE: z.coerce.number().positive().default(250_000),
  })
  .refine((env) => env.NODE_ENV !== 'production' || env.JWT_SECRET !== DEV_JWT_SECRET, {
    message: 'JWT_SECRET must be set in production',
    path: ['JWT_SECRET'],
  })
  .refine(
    (env) =>
      env.WHATSAPP_PROVIDER !== 'cloud-api' ||
      Boolean(env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID),
    {
      message: 'WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID are required for cloud-api',
      path: ['WHATSAPP_PROVIDER'],
    },
  )
  .refine(
    (env) =>
      env.MEETING_PROVIDER !== 'google-meet' ||
      Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN),
    {
      message: 'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REFRESH_TOKEN are required',
      path: ['MEETING_PROVIDER'],
    },
  );

export type Env = z.infer<typeof EnvSchema>;

// Singleton
export class AppConfig {
  static #instance: AppConfig | undefined;

  private constructor(readonly env: Readonly<Env>) {}

  static getInstance(): AppConfig {
    AppConfig.#instance ??= new AppConfig(Object.freeze(EnvSchema.parse(process.env)));
    return AppConfig.#instance;
  }

  static resetInstance(): void {
    AppConfig.#instance = undefined;
  }

  get isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }
}
