import type { AppLogger } from '#core/logging/AppLogger';
import { type Clock, SystemClock } from '#core/model/Clock';
import type { AppModule } from '#core/module/AppModule';
import { AppConfig, type Env } from '#infrastructure/config/AppConfig';
import { MongoConnection } from '#infrastructure/database/MongoConnection';
import { MongoTransactionManager } from '#infrastructure/database/MongoTransactionManager';
import { TransactionContext } from '#infrastructure/database/TransactionContext';
import { DateTimeFormatter } from '#infrastructure/format/DateTimeFormatter';
import { AuthGuard } from '#infrastructure/http/AuthGuard';
import { MongoRateLimitStore } from '#infrastructure/http/MongoRateLimitStore';
import { RateLimiter } from '#infrastructure/http/RateLimiter';
import { SessionCookie } from '#infrastructure/http/SessionCookie';
import { Logger } from '#infrastructure/logger/Logger';
import type { MailTransport } from '#infrastructure/mail/MailTransport';
import { SmtpMailTransport } from '#infrastructure/mail/SmtpMailTransport';
import { JoseTokenService } from '#infrastructure/security/JoseTokenService';
import { ScryptPasswordHasher } from '#infrastructure/security/ScryptPasswordHasher';
import { AppointmentsModule } from '#modules/appointments';
import { AuthModule } from '#modules/auth';
import { ClinicalRecordsModule } from '#modules/clinical-records';
import { DiagnosisCatalogModule } from '#modules/diagnosis-catalog';
import { HealthModule, MongoHealthIndicator } from '#modules/health';
import {
  LocalWhatsAppOutbox,
  NotificationsModule,
  WhatsAppCloudApiGateway,
  type WhatsAppGateway,
} from '#modules/notifications';
import { PatientsModule } from '#modules/patients';
import {
  type PaymentGateway,
  SimulatedPaymentGateway,
  SubscriptionsModule,
} from '#modules/subscriptions';
import {
  GoogleMeetLinkProvider,
  JitsiMeetingLinkProvider,
  type MeetingLinkProvider,
  VirtualConsultationsModule,
} from '#modules/virtual-consultations';

export interface ModuleOptions {
  clock?: Clock;
  mail?: MailTransport;
  whatsapp?: WhatsAppGateway;
  payments?: PaymentGateway;
  meetings?: MeetingLinkProvider;
}

function whatsappFrom(env: Env, logger: AppLogger): WhatsAppGateway {
  if (env.WHATSAPP_PROVIDER === 'cloud-api') {
    return new WhatsAppCloudApiGateway({
      token: env.WHATSAPP_TOKEN ?? '',
      phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID ?? '',
      apiVersion: env.WHATSAPP_API_VERSION,
      defaultCountryCode: '54',
    });
  }
  return new LocalWhatsAppOutbox(logger.child({ adapter: 'whatsapp-outbox' }));
}

function meetingsFrom(env: Env): MeetingLinkProvider {
  if (env.MEETING_PROVIDER === 'google-meet') {
    return new GoogleMeetLinkProvider({
      clientId: env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: env.GOOGLE_CLIENT_SECRET ?? '',
      refreshToken: env.GOOGLE_REFRESH_TOKEN ?? '',
      calendarId: env.GOOGLE_CALENDAR_ID,
    });
  }
  return new JitsiMeetingLinkProvider(env.JITSI_BASE_URL);
}

// Composition Root
export function createModules(options: ModuleOptions = {}): AppModule[] {
  const config = AppConfig.getInstance();
  const { env } = config;
  const logger = Logger.getInstance();
  const clock = options.clock ?? new SystemClock();
  const tokens = new JoseTokenService(env.JWT_SECRET, env.SESSION_TTL_SECONDS);
  const guard = new AuthGuard(tokens, clock);
  const context = new TransactionContext();
  const database = MongoConnection.getInstance();
  const transactions = new MongoTransactionManager(database, context);
  const dates = new DateTimeFormatter(env.APP_TIMEZONE);
  const mail = options.mail ?? new SmtpMailTransport(env.SMTP_URL, env.MAIL_FROM);
  const appUrl = env.APP_URL.replace(/\/$/, '');

  const subscriptions = new SubscriptionsModule({
    guard,
    clock,
    transactions,
    context,
    gateway: options.payments ?? new SimulatedPaymentGateway(),
    mail,
    dates,
    logger,
    prices: { monthly: env.PLAN_MONTHLY_PRICE, annual: env.PLAN_ANNUAL_PRICE },
    trialDays: env.TRIAL_DAYS,
    planUrl: `${appUrl}/settings/plan`,
  });
  const patients = new PatientsModule({ guard, clock, transactions, context, logger });
  const diagnoses = new DiagnosisCatalogModule({ guard });
  const notifications = new NotificationsModule({
    guard,
    clock,
    context,
    whatsapp: options.whatsapp ?? whatsappFrom(env, logger),
  });
  const appointments = new AppointmentsModule({
    guard,
    clock,
    patients: patients.directory,
    notifications: notifications.center,
    dates,
    logger,
    transactions,
    context,
  });

  return [
    new HealthModule({
      indicators: [new MongoHealthIndicator(database)],
      clock,
    }),
    new AuthModule({
      guard,
      cookie: new SessionCookie(config.isProduction, env.SESSION_TTL_SECONDS),
      hasher: new ScryptPasswordHasher(),
      tokens,
      clock,
      transactions,
      context,
      subscriptions: subscriptions.access,
      mail,
      dates,
      logger,
      recoveryUrl: `${appUrl}/forgot-password`,
      limiter: new RateLimiter(env.RATE_LIMIT_ENABLED, new MongoRateLimitStore()),
    }),
    subscriptions,
    patients,
    diagnoses,
    new ClinicalRecordsModule({
      guard,
      clock,
      patients: patients.directory,
      activity: patients.activity,
      catalog: diagnoses.catalog,
      transactions,
      context,
    }),
    appointments,
    notifications,
    new VirtualConsultationsModule({
      guard,
      clock,
      transactions,
      context,
      links: options.meetings ?? meetingsFrom(env),
      patients: patients.directory,
      appointments: appointments.directory,
      notifications: notifications.center,
    }),
  ];
}
