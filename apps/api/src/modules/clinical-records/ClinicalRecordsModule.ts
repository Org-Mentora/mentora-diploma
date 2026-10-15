import type { Router } from 'express';
import type { Clock } from '#core/model/Clock';
import type { AppModule } from '#core/module/AppModule';
import type { ContractRegistry } from '#core/module/ContractRegistry';
import type { View } from '#core/view/View';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import type { DiagnosisCatalog } from '#modules/diagnosis-catalog';
import type { PatientDirectory } from '#modules/patients';
import {
  type ClinicalRecordDto,
  type ConsultationDto,
  type DiagnosisHistoryEntryDto,
  registerClinicalRecordContracts,
} from './contracts/clinical-records.contracts';
import { CatalogDiagnosisResolver } from './infrastructure/CatalogDiagnosisResolver';
import { MongooseClinicalRecordRepository } from './infrastructure/MongooseClinicalRecordRepository';
import { PatientDirectoryLookup } from './infrastructure/PatientDirectoryLookup';
import type { ClinicalRecordRepository } from './model/ClinicalRecordRepository';
import { ClinicalRecordService } from './model/ClinicalRecordService';
import type { ClinicalRecordPresenterFactory } from './presenter/ClinicalRecordPresenterFactory';
import { GetClinicalRecordPresenter } from './presenter/GetClinicalRecordPresenter';
import { GetConsultationPresenter } from './presenter/GetConsultationPresenter';
import { GetDiagnosisHistoryPresenter } from './presenter/GetDiagnosisHistoryPresenter';
import { RegisterConsultationPresenter } from './presenter/RegisterConsultationPresenter';
import { ClinicalRecordRoutes } from './view/ClinicalRecordRoutes';

export interface ClinicalRecordsModuleDependencies {
  guard: AuthGuard;
  clock: Clock;
  patients: PatientDirectory;
  catalog: DiagnosisCatalog;
  /** Defaults to MongoDB; tests may pass an in-memory implementation. */
  repository?: ClinicalRecordRepository;
}

/** Composition root of the clinical record module (CU-08, CU-09, CU-11, CU-12). */
export class ClinicalRecordsModule implements AppModule, ClinicalRecordPresenterFactory {
  readonly basePath = '/patients';
  readonly #service: ClinicalRecordService;

  constructor(private readonly deps: ClinicalRecordsModuleDependencies) {
    this.#service = new ClinicalRecordService(
      deps.repository ?? new MongooseClinicalRecordRepository(),
      new PatientDirectoryLookup(deps.patients),
      new CatalogDiagnosisResolver(deps.catalog),
      deps.clock,
    );
  }

  registerContracts(registry: ContractRegistry): void {
    registerClinicalRecordContracts(registry);
  }

  createRouter(): Router {
    return new ClinicalRecordRoutes(this, this.deps.guard).build();
  }

  getClinicalRecord(view: View<ClinicalRecordDto>): GetClinicalRecordPresenter {
    return new GetClinicalRecordPresenter(view, this.#service);
  }

  registerConsultation(view: View<ConsultationDto>): RegisterConsultationPresenter {
    return new RegisterConsultationPresenter(view, this.#service);
  }

  getConsultation(view: View<ConsultationDto>): GetConsultationPresenter {
    return new GetConsultationPresenter(view, this.#service);
  }

  getDiagnosisHistory(view: View<DiagnosisHistoryEntryDto[]>): GetDiagnosisHistoryPresenter {
    return new GetDiagnosisHistoryPresenter(view, this.#service);
  }
}
