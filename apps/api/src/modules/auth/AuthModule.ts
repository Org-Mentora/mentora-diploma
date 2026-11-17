import type { Router } from 'express';
import type { AppLogger } from '#core/logging/AppLogger';
import type { Clock } from '#core/model/Clock';
import type { TransactionManager } from '#core/model/TransactionManager';
import type { AppModule } from '#core/module/AppModule';
import type { ContractRegistry } from '#core/module/ContractRegistry';
import type { DataMigration } from '#core/module/DataMigration';
import type { PasswordHasher } from '#core/security/PasswordHasher';
import type { TokenService } from '#core/security/TokenService';
import type { View } from '#core/view/View';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { DateTimeFormatter } from '#infrastructure/format/DateTimeFormatter';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import type { RateLimiter } from '#infrastructure/http/RateLimiter';
import type { SessionCookie } from '#infrastructure/http/SessionCookie';
import type { MailTransport } from '#infrastructure/mail/MailTransport';
import type { SubscriptionAccess } from '#modules/subscriptions';
import {
  type LogoDto,
  type RecoveryRequestedDto,
  registerAuthContracts,
  type SessionDto,
} from './contracts/auth.contracts';
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
import type { ProfessionalRepository } from './model/ProfessionalRepository';
import { ProfileService } from './model/ProfileService';
import type { AuthPresenterFactory } from './presenter/AuthPresenterFactory';
import { ChangePasswordPresenter } from './presenter/ChangePasswordPresenter';
import { GetCurrentProfessionalPresenter } from './presenter/GetCurrentProfessionalPresenter';
import { GetLogoPresenter } from './presenter/GetLogoPresenter';
import { LoginPresenter } from './presenter/LoginPresenter';
import { RegisterProfessionalPresenter } from './presenter/RegisterProfessionalPresenter';
import { RemoveLogoPresenter } from './presenter/RemoveLogoPresenter';
import { RequestPasswordRecoveryPresenter } from './presenter/RequestPasswordRecoveryPresenter';
import { ResetPasswordPresenter } from './presenter/ResetPasswordPresenter';
import type { SessionResult } from './presenter/SessionViewModel';
import { UpdateProfilePresenter } from './presenter/UpdateProfilePresenter';
import { UploadLogoPresenter } from './presenter/UploadLogoPresenter';
import { VerifyRecoveryCodePresenter } from './presenter/VerifyRecoveryCodePresenter';
import { AuthRoutes } from './view/AuthRoutes';

export interface AuthModuleDependencies {
  guard: AuthGuard;
  cookie: SessionCookie;
  hasher: PasswordHasher;
  tokens: TokenService;
  clock: Clock;
  transactions: TransactionManager;
  context: TransactionContext;
  subscriptions: SubscriptionAccess;
  mail: MailTransport;
  dates: DateTimeFormatter;
  logger: AppLogger;
  recoveryUrl: string;
  limiter: RateLimiter;
  professionals?: ProfessionalRepository;
  recoveries?: PasswordRecoveryRepository;
  logos?: LogoRepository;
}

// Composition Root, Abstract Factory
export class AuthModule implements AppModule, AuthPresenterFactory {
  readonly basePath = '/auth';
  readonly #auth: AuthService;
  readonly #profiles: ProfileService;
  readonly #recovery: PasswordRecoveryService;
  readonly #migration: LegacySubscriptionMigration;

  constructor(private readonly deps: AuthModuleDependencies) {
    const professionals = deps.professionals ?? new MongooseProfessionalRepository(deps.context);
    const access = new SubscriptionAccessAdapter(deps.subscriptions);
    const logger = deps.logger.child({ module: 'auth' });
    this.#auth = new AuthService(
      professionals,
      access,
      deps.transactions,
      deps.hasher,
      deps.tokens,
      deps.clock,
    );
    this.#profiles = new ProfileService(
      this.#auth,
      professionals,
      deps.logos ?? new MongooseLogoRepository(deps.context),
      access,
      deps.transactions,
      deps.clock,
    );
    this.#recovery = new PasswordRecoveryService(
      professionals,
      deps.recoveries ?? new MongoosePasswordRecoveryRepository(deps.context),
      new CryptoRecoveryCodeGenerator(),
      deps.hasher,
      new EmailPasswordRecoveryNotifier(deps.mail, deps.dates, deps.recoveryUrl, logger),
      deps.transactions,
      deps.clock,
    );
    this.#migration = new LegacySubscriptionMigration(deps.subscriptions, logger);
  }

  registerContracts(registry: ContractRegistry): void {
    registerAuthContracts(registry);
  }

  createRouter(): Router {
    return new AuthRoutes(this, this.deps.guard, this.deps.cookie, this.deps.limiter).build();
  }

  migrations(): DataMigration[] {
    return [{ name: '2026-11-legacy-subscriptions', run: () => this.#migration.run() }];
  }

  registerProfessional(view: View<SessionResult>): RegisterProfessionalPresenter {
    return new RegisterProfessionalPresenter(view, this.#auth);
  }

  login(view: View<SessionResult>): LoginPresenter {
    return new LoginPresenter(view, this.#auth);
  }

  getCurrentProfessional(view: View<SessionResult>): GetCurrentProfessionalPresenter {
    return new GetCurrentProfessionalPresenter(view, this.#auth);
  }

  requestPasswordRecovery(view: View<RecoveryRequestedDto>): RequestPasswordRecoveryPresenter {
    return new RequestPasswordRecoveryPresenter(view, this.#recovery);
  }

  verifyRecoveryCode(view: View<void>): VerifyRecoveryCodePresenter {
    return new VerifyRecoveryCodePresenter(view, this.#recovery);
  }

  resetPassword(view: View<void>): ResetPasswordPresenter {
    return new ResetPasswordPresenter(view, this.#recovery);
  }

  changePassword(view: View<SessionResult>): ChangePasswordPresenter {
    return new ChangePasswordPresenter(view, this.#auth);
  }

  updateProfile(view: View<SessionDto>): UpdateProfilePresenter {
    return new UpdateProfilePresenter(view, this.#profiles);
  }

  getLogo(view: View<LogoDto>): GetLogoPresenter {
    return new GetLogoPresenter(view, this.#profiles);
  }

  uploadLogo(view: View<void>): UploadLogoPresenter {
    return new UploadLogoPresenter(view, this.#profiles);
  }

  removeLogo(view: View<void>): RemoveLogoPresenter {
    return new RemoveLogoPresenter(view, this.#profiles);
  }
}
