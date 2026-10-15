/** Public API of the DSM-5 diagnosis catalog. */
export type { DiagnosisCatalogEntryDto } from './contracts/diagnosis-catalog.contracts';
export {
  DiagnosisCatalogModule,
  type DiagnosisCatalogModuleDependencies,
} from './DiagnosisCatalogModule';
export type { DiagnosisCatalog } from './model/DiagnosisCatalog';
export type { DiagnosisCatalogEntry } from './model/DiagnosisCatalogEntry';
