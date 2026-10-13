import type { Router } from 'express';
import type { AppModule } from '#core/module/AppModule';
import type { ContractRegistry } from '#core/module/ContractRegistry';
import type { View } from '#core/view/View';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import {
  type DiagnosisCatalogEntryDto,
  registerDiagnosisCatalogContracts,
} from './contracts/diagnosis-catalog.contracts';
import { DiagnosisCatalogSeeder } from './infrastructure/DiagnosisCatalogSeeder';
import { MongooseDiagnosisCatalogRepository } from './infrastructure/MongooseDiagnosisCatalogRepository';
import { DiagnosisCatalog } from './model/DiagnosisCatalog';
import type { DiagnosisCatalogPresenterFactory } from './presenter/DiagnosisCatalogPresenterFactory';
import { SearchDiagnosesPresenter } from './presenter/SearchDiagnosesPresenter';
import { DiagnosisCatalogRoutes } from './view/DiagnosisCatalogRoutes';

/** Composition root of the DSM-5 catalog (CU-11). */
export class DiagnosisCatalogModule implements AppModule, DiagnosisCatalogPresenterFactory {
  readonly basePath = '/diagnoses';
  /** Query service other modules depend on (ADR-0022). */
  readonly catalog = new DiagnosisCatalog(new MongooseDiagnosisCatalogRepository());

  constructor(private readonly guard: AuthGuard) {}

  registerContracts(registry: ContractRegistry): void {
    registerDiagnosisCatalogContracts(registry);
  }

  createRouter(): Router {
    return new DiagnosisCatalogRoutes(this, this.guard).build();
  }

  async onBootstrap(): Promise<void> {
    await new DiagnosisCatalogSeeder().seed();
  }

  searchDiagnoses(view: View<DiagnosisCatalogEntryDto[]>): SearchDiagnosesPresenter {
    return new SearchDiagnosesPresenter(view, this.catalog);
  }
}
