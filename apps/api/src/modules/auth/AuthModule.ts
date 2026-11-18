import type { Router } from 'express';
import type { DateFormatter } from '#core/format/DateFormatter';
import type { AppLogger } from '#core/logging/AppLogger';
import type { AuditTrail } from '#core/model/AuditTrail';
import type { Clock } from '#core/model/Clock';
import type { IdGenerator } from '#core/model/IdGenerator';
import type { TransactionManager } from '#core/model/TransactionManager';
import type { AppModule } from '#core/module/AppModule';
import type { ContractRegistry } from '#core/module/ContractRegistry';
import type { DataMigration } from '#core/module/DataMigration';
import type { PasswordHasher } from '#core/security/PasswordHasher';
import type { TokenService } from '#core/security/TokenService';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import type { RateLimiter } from '#infrastructure/http/RateLimiter';
import type { SessionCookie } from '#infrastructure/http/SessionCookie';
import type { MailTransport } from '#infrastructure/mail/MailTransport';
import type { SubscriptionAccess } from '#modules/subscriptions';
import { registerAuthContracts } from './contracts/auth.contracts';
import { CryptoRecoveryCodeGenerator } from './infrastructure/CryptoRecoveryCodeGenerator';
import { EmailPasswordRecoveryNotifier } from './infrastructure/EmailPasswordRecoveryNotifier';
import { LegacySubscriptionMigration } from './infrastructure/LegacySubscriptionMigration';
import { MongooseLogoRepository } from './infrastructure/MongooseLogoRepository';
import { MongoosePasswordRecoveryRepository } from './infrastructure/MongoosePasswordRecoveryRepository';
import { MongooseProfessionalRepository } from './infrastructure/MongooseProfessionalRepository';
import { SubscriptionAccessAdapter } from './infrastructure/SubscriptionAccessAdapter';
import { AuthService } from './model/AuthService';
import type { LogoRepository } from './model/LogoRepository';
import type { PasswordRecoveryRepository } from './model/PasswordRecoveryRepository';
import { PasswordRecoveryService } from './model/PasswordRecoveryService';
import { ProfessionalDirectory } from './model/ProfessionalDirectory';
import type { ProfessionalRepository } from './model/ProfessionalRepository';
import { ProfileService } from './model/ProfileService';
import { AuthPresenters } from './presenter/AuthPresenters';
import { AuthRoutes } from './view/AuthRoutes';

export interface AuthModuleDependencies {
  guard: AuthGuard;
  cookie: SessionCookie;
  hasher: PasswordHasher;
  tokens: TokenService;
  clock: Clock;
  ids: IdGenerator;
  transactions: TransactionManager;
  context: TransactionContext;
  subscriptions: SubscriptionAccess;
  mail: MailTransport;
  dates: DateFormatter;
  logger: AppLogger;
  recoveryUrl: string;
  limiter: RateLimiter;
  audit: AuditTrail;
  professionals?: ProfessionalRepository;
  recoveries?: PasswordRecoveryRepository;
  logos?: LogoRepository;
}

// Composition Root
export class AuthModule implements AppModule {
  readonly basePath = '/auth';
  readonly directory: ProfessionalDirectory;
  readonly #auth: AuthService;
  readonly #profiles: ProfileService;
  readonly #recovery: PasswordRecoveryService;
  readonly #migration: LegacySubscriptionMigration;

  constructor(private readonly deps: AuthModuleDependencies) {
    const professionals = deps.professionals ?? new MongooseProfessionalRepository(deps.context);
    const access = new SubscriptionAccessAdapter(deps.subscriptions);
    this.directory = new ProfessionalDirectory(professionals);
    const logger = deps.logger.child({ module: 'auth' });
    this.#auth = new AuthService(
      professionals,
      access,
      deps.transactions,
      deps.hasher,
      deps.tokens,
      deps.clock,
      deps.ids,
      deps.audit,
    );
    this.#profiles = new ProfileService(
      this.#auth,
      professionals,
      deps.logos ?? new MongooseLogoRepository(deps.context),
      access,
      deps.transactions,
      deps.clock,
      deps.audit,
    );
    this.#recovery = new PasswordRecoveryService(
      professionals,
      deps.recoveries ?? new MongoosePasswordRecoveryRepository(deps.context),
      new CryptoRecoveryCodeGenerator(),
      deps.hasher,
      new EmailPasswordRecoveryNotifier(deps.mail, deps.dates, deps.recoveryUrl, logger),
      deps.transactions,
      deps.clock,
      deps.ids,
      deps.audit,
    );
    this.#migration = new LegacySubscriptionMigration(deps.subscriptions, logger);
  }

  registerContracts(registry: ContractRegistry): void {
    registerAuthContracts(registry);
  }

  createRouter(): Router {
    return new AuthRoutes(
      new AuthPresenters(this.#auth, this.#recovery, this.#profiles),
      this.deps.guard,
      this.deps.cookie,
      this.deps.limiter,
    ).build();
  }

  migrations(): DataMigration[] {
    return [{ name: '2026-11-legacy-subscriptions', run: () => this.#migration.run() }];
  }
}
