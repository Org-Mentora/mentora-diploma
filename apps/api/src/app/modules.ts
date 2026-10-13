import { type Clock, SystemClock } from '#core/model/Clock';
import type { AppModule } from '#core/module/AppModule';
import { AppConfig } from '#infrastructure/config/AppConfig';
import { AuthGuard } from '#infrastructure/http/AuthGuard';
import { SessionCookie } from '#infrastructure/http/SessionCookie';
import { Logger } from '#infrastructure/logger/Logger';
import { JoseTokenService } from '#infrastructure/security/JoseTokenService';
import { ScryptPasswordHasher } from '#infrastructure/security/ScryptPasswordHasher';
import { AppointmentsModule } from '#modules/appointments';
import { AuthModule } from '#modules/auth';
import { ClinicalRecordsModule } from '#modules/clinical-records';
import { DiagnosisCatalogModule } from '#modules/diagnosis-catalog';
import { HealthModule } from '#modules/health';
import { PatientsModule } from '#modules/patients';

export interface ModuleOptions {
  /** Inject a fixed clock in tests. */
  clock?: Clock;
}

/**
 * Every feature module of the API, wired once with the shared collaborators. This is the only
 * place that turns Singletons into injected dependencies (ADR-0006). Register new modules here.
 */
export function createModules(options: ModuleOptions = {}): AppModule[] {
  const config = AppConfig.getInstance();
  const { env } = config;
  const clock = options.clock ?? new SystemClock();
  const tokens = new JoseTokenService(env.JWT_SECRET, env.SESSION_TTL_SECONDS);
  const guard = new AuthGuard(tokens, clock);

  const patients = new PatientsModule(guard, clock);
  const diagnoses = new DiagnosisCatalogModule(guard);

  return [
    new HealthModule(),
    new AuthModule({
      guard,
      cookie: new SessionCookie(config.isProduction, env.SESSION_TTL_SECONDS),
      hasher: new ScryptPasswordHasher(),
      tokens,
      clock,
      trialDays: env.TRIAL_DAYS,
    }),
    patients,
    diagnoses,
    new ClinicalRecordsModule({
      guard,
      clock,
      patients: patients.directory,
      catalog: diagnoses.catalog,
    }),
    new AppointmentsModule({
      guard,
      clock,
      patients: patients.directory,
      logger: Logger.getInstance(),
    }),
  ];
}
