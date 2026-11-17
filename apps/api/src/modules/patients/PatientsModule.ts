import type { Router } from 'express';
import type { AppLogger } from '#core/logging/AppLogger';
import type { Clock } from '#core/model/Clock';
import type { TransactionManager } from '#core/model/TransactionManager';
import type { AppModule } from '#core/module/AppModule';
import type { ContractRegistry } from '#core/module/ContractRegistry';
import type { ScheduledJob } from '#core/scheduling/ScheduledJob';
import type { View } from '#core/view/View';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import {
  type PatientDto,
  type PatientSummaryDto,
  registerPatientContracts,
} from './contracts/patients.contracts';
import { MongoosePatientRepository } from './infrastructure/MongoosePatientRepository';
import { PatientActivity } from './model/PatientActivity';
import { PatientDirectory } from './model/PatientDirectory';
import type { PatientRepository } from './model/PatientRepository';
import { PatientService } from './model/PatientService';
import { ChangePatientStatusPresenter } from './presenter/ChangePatientStatusPresenter';
import { CreatePatientPresenter } from './presenter/CreatePatientPresenter';
import { GetPatientPresenter } from './presenter/GetPatientPresenter';
import type { PatientPresenterFactory } from './presenter/PatientPresenterFactory';
import { SearchPatientsPresenter } from './presenter/SearchPatientsPresenter';
import { UpdatePatientPresenter } from './presenter/UpdatePatientPresenter';
import { PatientRoutes } from './view/PatientRoutes';

export interface PatientsModuleDependencies {
  guard: AuthGuard;
  clock: Clock;
  transactions: TransactionManager;
  context: TransactionContext;
  logger: AppLogger;
  repository?: PatientRepository;
}

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

// Composition Root, Abstract Factory
export class PatientsModule implements AppModule, PatientPresenterFactory {
  readonly basePath = '/patients';
  readonly directory: PatientDirectory;
  readonly activity: PatientActivity;
  readonly #service: PatientService;

  constructor(private readonly deps: PatientsModuleDependencies) {
    const repository = deps.repository ?? new MongoosePatientRepository(deps.context);
    this.#service = new PatientService(repository, deps.transactions, deps.clock);
    this.directory = new PatientDirectory(repository);
    this.activity = new PatientActivity(repository);
  }

  registerContracts(registry: ContractRegistry): void {
    registerPatientContracts(registry);
  }

  createRouter(): Router {
    return new PatientRoutes(this, this.deps.guard).build();
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

  createPatient(view: View<PatientDto>): CreatePatientPresenter {
    return new CreatePatientPresenter(view, this.#service);
  }

  searchPatients(view: View<PatientSummaryDto[]>): SearchPatientsPresenter {
    return new SearchPatientsPresenter(view, this.#service);
  }

  getPatient(view: View<PatientDto>): GetPatientPresenter {
    return new GetPatientPresenter(view, this.#service);
  }

  updatePatient(view: View<PatientDto>): UpdatePatientPresenter {
    return new UpdatePatientPresenter(view, this.#service);
  }

  changePatientStatus(view: View<PatientDto>): ChangePatientStatusPresenter {
    return new ChangePatientStatusPresenter(view, this.#service);
  }
}
