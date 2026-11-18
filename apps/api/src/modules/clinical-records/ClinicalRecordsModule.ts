import type { Router } from 'express';
import type { AuditTrail } from '#core/model/AuditTrail';
import type { Clock } from '#core/model/Clock';
import type { IdGenerator } from '#core/model/IdGenerator';
import type { TransactionManager } from '#core/model/TransactionManager';
import type { AppModule } from '#core/module/AppModule';
import type { ContractRegistry } from '#core/module/ContractRegistry';
import type { DataMigration } from '#core/module/DataMigration';
import type { View } from '#core/view/View';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import type { DiagnosisCatalog } from '#modules/diagnosis-catalog';
import type { PatientActivity, PatientDirectory } from '#modules/patients';
import {
  type ClinicalRecordDto,
  type ConsultationDto,
  type DiagnosisHistoryPageDto,
  type RecordAccessPageDto,
  registerClinicalRecordContracts,
} from './contracts/clinical-records.contracts';
import { CatalogDiagnosisResolver } from './infrastructure/CatalogDiagnosisResolver';
import { ClinicalActivityBackfill } from './infrastructure/ClinicalActivityBackfill';
import { MongooseClinicalRecordRepository } from './infrastructure/MongooseClinicalRecordRepository';
import { MongooseRecordAccessLog } from './infrastructure/MongooseRecordAccessLog';
import { PatientActivityRecorder } from './infrastructure/PatientActivityRecorder';
import { PatientDirectoryLookup } from './infrastructure/PatientDirectoryLookup';
import type { ClinicalRecordRepository } from './model/ClinicalRecordRepository';
import { ClinicalRecordService } from './model/ClinicalRecordService';
import type { RecordAccessLog } from './model/RecordAccessLog';
import type { ClinicalRecordPresenterFactory } from './presenter/ClinicalRecordPresenterFactory';
import { GetClinicalRecordPresenter } from './presenter/GetClinicalRecordPresenter';
import { GetConsultationPresenter } from './presenter/GetConsultationPresenter';
import { GetDiagnosisHistoryPresenter } from './presenter/GetDiagnosisHistoryPresenter';
import { ListRecordAccessPresenter } from './presenter/ListRecordAccessPresenter';
import { RegisterConsultationPresenter } from './presenter/RegisterConsultationPresenter';
import { ClinicalRecordRoutes } from './view/ClinicalRecordRoutes';

export interface ClinicalRecordsModuleDependencies {
  guard: AuthGuard;
  clock: Clock;
  ids: IdGenerator;
  patients: PatientDirectory;
  activity: PatientActivity;
  catalog: DiagnosisCatalog;
  transactions: TransactionManager;
  context: TransactionContext;
  audit: AuditTrail;
  repository?: ClinicalRecordRepository;
  accessLog?: RecordAccessLog;
}

// Composition Root, Abstract Factory
export class ClinicalRecordsModule implements AppModule, ClinicalRecordPresenterFactory {
  readonly basePath = '/patients';
  readonly #service: ClinicalRecordService;
  readonly #backfill: ClinicalActivityBackfill;

  constructor(private readonly deps: ClinicalRecordsModuleDependencies) {
    const activity = new PatientActivityRecorder(deps.activity);
    this.#backfill = new ClinicalActivityBackfill(activity);
    this.#service = new ClinicalRecordService(
      deps.repository ?? new MongooseClinicalRecordRepository(deps.context),
      deps.transactions,
      new PatientDirectoryLookup(deps.patients),
      activity,
      new CatalogDiagnosisResolver(deps.catalog),
      deps.clock,
      deps.accessLog ?? new MongooseRecordAccessLog(deps.context),
      deps.ids,
      deps.audit,
    );
  }

  registerContracts(registry: ContractRegistry): void {
    registerClinicalRecordContracts(registry);
  }

  createRouter(): Router {
    return new ClinicalRecordRoutes(this, this.deps.guard).build();
  }

  migrations(): DataMigration[] {
    return [{ name: '2026-11-clinical-activity-backfill', run: () => this.#backfill.run() }];
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

  getDiagnosisHistory(view: View<DiagnosisHistoryPageDto>): GetDiagnosisHistoryPresenter {
    return new GetDiagnosisHistoryPresenter(view, this.#service);
  }

  listRecordAccess(view: View<RecordAccessPageDto>): ListRecordAccessPresenter {
    return new ListRecordAccessPresenter(view, this.#service);
  }
}
