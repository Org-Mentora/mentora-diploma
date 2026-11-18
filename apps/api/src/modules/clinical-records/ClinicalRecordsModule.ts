import type { Router } from 'express';
import type { AuditTrail } from '#core/model/AuditTrail';
import type { Clock } from '#core/model/Clock';
import type { IdGenerator } from '#core/model/IdGenerator';
import type { TransactionManager } from '#core/model/TransactionManager';
import type { AppModule } from '#core/module/AppModule';
import type { ContractRegistry } from '#core/module/ContractRegistry';
import type { DataMigration } from '#core/module/DataMigration';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import type { DiagnosisCatalog } from '#modules/diagnosis-catalog';
import type { PatientActivity, PatientDirectory } from '#modules/patients';
import { registerClinicalRecordContracts } from './contracts/clinical-records.contracts';
import { CatalogDiagnosisResolver } from './infrastructure/CatalogDiagnosisResolver';
import { ClinicalActivityBackfill } from './infrastructure/ClinicalActivityBackfill';
import { MongooseClinicalRecordRepository } from './infrastructure/MongooseClinicalRecordRepository';
import { MongooseRecordAccessLog } from './infrastructure/MongooseRecordAccessLog';
import { PatientActivityRecorder } from './infrastructure/PatientActivityRecorder';
import { PatientDirectoryLookup } from './infrastructure/PatientDirectoryLookup';
import type { ClinicalRecordRepository } from './model/ClinicalRecordRepository';
import { ClinicalRecordService } from './model/ClinicalRecordService';
import type { RecordAccessLog } from './model/RecordAccessLog';
import { ClinicalRecordPresenters } from './presenter/ClinicalRecordPresenters';
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

// Composition Root
export class ClinicalRecordsModule implements AppModule {
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
    return new ClinicalRecordRoutes(
      new ClinicalRecordPresenters(this.#service),
      this.deps.guard,
    ).build();
  }

  migrations(): DataMigration[] {
    return [{ name: '2026-11-clinical-activity-backfill', run: () => this.#backfill.run() }];
  }
}
