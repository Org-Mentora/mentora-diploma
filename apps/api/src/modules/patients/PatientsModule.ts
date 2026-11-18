import type { Router } from 'express';
import type { AppLogger } from '#core/logging/AppLogger';
import type { AuditTrail } from '#core/model/AuditTrail';
import type { Clock } from '#core/model/Clock';
import type { IdGenerator } from '#core/model/IdGenerator';
import type { TransactionManager } from '#core/model/TransactionManager';
import type { AppModule } from '#core/module/AppModule';
import type { ContractRegistry } from '#core/module/ContractRegistry';
import type { ScheduledJob } from '#core/scheduling/ScheduledJob';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import { registerPatientContracts } from './contracts/patients.contracts';
import { MongoosePatientRepository } from './infrastructure/MongoosePatientRepository';
import { PatientActivity } from './model/PatientActivity';
import { PatientDirectory } from './model/PatientDirectory';
import { PatientIntake } from './model/PatientIntake';
import type { PatientRepository } from './model/PatientRepository';
import { PatientService } from './model/PatientService';
import { PatientPresenters } from './presenter/PatientPresenters';
import { PatientRoutes } from './view/PatientRoutes';

export interface PatientsModuleDependencies {
  guard: AuthGuard;
  clock: Clock;
  ids: IdGenerator;
  transactions: TransactionManager;
  context: TransactionContext;
  logger: AppLogger;
  audit: AuditTrail;
  repository?: PatientRepository;
}

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

// Composition Root
export class PatientsModule implements AppModule {
  readonly basePath = '/patients';
  readonly directory: PatientDirectory;
  readonly activity: PatientActivity;
  readonly intake: PatientIntake;
  readonly #service: PatientService;

  constructor(private readonly deps: PatientsModuleDependencies) {
    const repository = deps.repository ?? new MongoosePatientRepository(deps.context);
    this.#service = new PatientService(
      repository,
      deps.transactions,
      deps.clock,
      deps.ids,
      deps.audit,
    );
    this.intake = new PatientIntake(this.#service);
    this.directory = new PatientDirectory(repository);
    this.activity = new PatientActivity(repository);
  }

  registerContracts(registry: ContractRegistry): void {
    registerPatientContracts(registry);
  }

  createRouter(): Router {
    return new PatientRoutes(new PatientPresenters(this.#service), this.deps.guard).build();
  }

  scheduledJobs(): ScheduledJob[] {
    return [
      {
        name: 'patients.inactivate-dormant',
        intervalMs: SIX_HOURS_MS,
        run: async () => {
          const count = await this.#service.inactivateDormant();
          if (count > 0) {
            this.deps.logger.info('Dormant patients marked inactive', { count });
          }
        },
      },
    ];
  }
}
