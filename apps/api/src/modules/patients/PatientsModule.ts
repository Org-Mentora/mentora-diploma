import type { Router } from 'express';
import type { Clock } from '#core/model/Clock';
import type { AppModule } from '#core/module/AppModule';
import type { ContractRegistry } from '#core/module/ContractRegistry';
import type { View } from '#core/view/View';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import {
  type PatientDto,
  type PatientSummaryDto,
  registerPatientContracts,
} from './contracts/patients.contracts';
import { MongoosePatientRepository } from './infrastructure/MongoosePatientRepository';
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
  /** Defaults to MongoDB; tests may pass an in-memory implementation. */
  repository?: PatientRepository;
}

/** Composition root of the patients module (CU-04..CU-07). */
export class PatientsModule implements AppModule, PatientPresenterFactory {
  readonly basePath = '/patients';
  /** Query service other modules depend on (ADR-0022). */
  readonly directory: PatientDirectory;
  readonly #service: PatientService;

  constructor(private readonly deps: PatientsModuleDependencies) {
    const repository = deps.repository ?? new MongoosePatientRepository();
    this.#service = new PatientService(repository, deps.clock);
    this.directory = new PatientDirectory(repository);
  }

  registerContracts(registry: ContractRegistry): void {
    registerPatientContracts(registry);
  }

  createRouter(): Router {
    return new PatientRoutes(this, this.deps.guard).build();
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
