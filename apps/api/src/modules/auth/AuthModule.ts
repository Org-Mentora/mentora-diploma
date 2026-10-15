import type { Router } from 'express';
import type { Clock } from '#core/model/Clock';
import type { AppModule } from '#core/module/AppModule';
import type { ContractRegistry } from '#core/module/ContractRegistry';
import type { PasswordHasher } from '#core/security/PasswordHasher';
import type { TokenService } from '#core/security/TokenService';
import type { View } from '#core/view/View';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import type { SessionCookie } from '#infrastructure/http/SessionCookie';
import { registerAuthContracts, type SessionDto } from './contracts/auth.contracts';
import { MongooseProfessionalRepository } from './infrastructure/MongooseProfessionalRepository';
import { AuthService } from './model/AuthService';
import type { ProfessionalRepository } from './model/ProfessionalRepository';
import type { AuthPresenterFactory } from './presenter/AuthPresenterFactory';
import { GetCurrentProfessionalPresenter } from './presenter/GetCurrentProfessionalPresenter';
import { LoginPresenter } from './presenter/LoginPresenter';
import { RegisterProfessionalPresenter } from './presenter/RegisterProfessionalPresenter';
import type { SessionResult } from './presenter/SessionViewModel';
import { AuthRoutes } from './view/AuthRoutes';

export interface AuthModuleDependencies {
  guard: AuthGuard;
  cookie: SessionCookie;
  hasher: PasswordHasher;
  tokens: TokenService;
  clock: Clock;
  trialDays: number;
  /** Defaults to MongoDB; tests may pass an in-memory implementation. */
  repository?: ProfessionalRepository;
}

/** Composition root of the auth module (CU-01, CU-03). */
export class AuthModule implements AppModule, AuthPresenterFactory {
  readonly basePath = '/auth';
  readonly #service: AuthService;

  constructor(private readonly deps: AuthModuleDependencies) {
    this.#service = new AuthService(
      deps.repository ?? new MongooseProfessionalRepository(),
      deps.hasher,
      deps.tokens,
      deps.clock,
      deps.trialDays,
    );
  }

  registerContracts(registry: ContractRegistry): void {
    registerAuthContracts(registry);
  }

  createRouter(): Router {
    return new AuthRoutes(this, this.deps.guard, this.deps.cookie).build();
  }

  registerProfessional(view: View<SessionResult>): RegisterProfessionalPresenter {
    return new RegisterProfessionalPresenter(view, this.#service);
  }

  login(view: View<SessionResult>): LoginPresenter {
    return new LoginPresenter(view, this.#service);
  }

  getCurrentProfessional(view: View<SessionDto>): GetCurrentProfessionalPresenter {
    return new GetCurrentProfessionalPresenter(view, this.#service);
  }
}
