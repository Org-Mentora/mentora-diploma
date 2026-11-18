import type { Router } from 'express';
import type { AppModule } from '#core/module/AppModule';
import type { ContractRegistry } from '#core/module/ContractRegistry';
import type { View } from '#core/view/View';
import type { AuthGuard } from '#infrastructure/http/AuthGuard';
import {
  type DiagnosisCatalogPageDto,
  registerDiagnosisCatalogContracts,
} from './contracts/diagnosis-catalog.contracts';
import { MongooseDiagnosisCatalogRepository } from './infrastructure/MongooseDiagnosisCatalogRepository';
import { MongooseDiagnosisCatalogSeeder } from './infrastructure/MongooseDiagnosisCatalogSeeder';
import { DiagnosisCatalog } from './model/DiagnosisCatalog';
import type { DiagnosisCatalogRepository } from './model/DiagnosisCatalogRepository';
import type { DiagnosisCatalogSeeder } from './model/DiagnosisCatalogSeeder';
import type { DiagnosisCatalogPresenterFactory } from './presenter/DiagnosisCatalogPresenterFactory';
import { SearchDiagnosesPresenter } from './presenter/SearchDiagnosesPresenter';
import { DiagnosisCatalogRoutes } from './view/DiagnosisCatalogRoutes';

export interface DiagnosisCatalogModuleDependencies {
  guard: AuthGuard;
  repository?: DiagnosisCatalogRepository;
  seeder?: DiagnosisCatalogSeeder;
}

// Composition Root, Abstract Factory
export class DiagnosisCatalogModule implements AppModule, DiagnosisCatalogPresenterFactory {
  readonly basePath = '/diagnoses';
  readonly catalog: DiagnosisCatalog;
  readonly #seeder: DiagnosisCatalogSeeder;

  constructor(private readonly deps: DiagnosisCatalogModuleDependencies) {
    this.catalog = new DiagnosisCatalog(
      deps.repository ?? new MongooseDiagnosisCatalogRepository(),
    );
    this.#seeder = deps.seeder ?? new MongooseDiagnosisCatalogSeeder();
  }

  registerContracts(registry: ContractRegistry): void {
    registerDiagnosisCatalogContracts(registry);
  }

  createRouter(): Router {
    return new DiagnosisCatalogRoutes(this, this.deps.guard).build();
  }

  async onBootstrap(): Promise<void> {
    await this.#seeder.seed();
  }

  searchDiagnoses(view: View<DiagnosisCatalogPageDto>): SearchDiagnosesPresenter {
    return new SearchDiagnosesPresenter(view, this.catalog);
  }
}
