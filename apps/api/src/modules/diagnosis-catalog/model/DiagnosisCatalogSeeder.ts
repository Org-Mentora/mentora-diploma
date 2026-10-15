/**
 * Preloads the DSM-5 catalog ("precargado", CU-11 precondition). The Model owns the
 * abstraction; the storage-specific upsert lives in `../infrastructure`.
 */
export abstract class DiagnosisCatalogSeeder {
  /** Idempotent. Returns how many entries were written. */
  abstract seed(): Promise<number>;
}
