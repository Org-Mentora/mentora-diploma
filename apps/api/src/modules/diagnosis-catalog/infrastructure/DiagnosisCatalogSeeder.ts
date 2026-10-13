import { DiagnosisCatalogModel } from './DiagnosisCatalogSchema';
import { DSM5_SEED, type Dsm5SeedEntry } from './dsm5Seed';

/**
 * Loads the DSM-5 catalog ("precargado", CU-11 precondition). Idempotent: every entry is
 * upserted by code, so editing `dsm5Seed.ts` and restarting keeps the catalog in sync.
 */
export class DiagnosisCatalogSeeder {
  constructor(private readonly entries: readonly Dsm5SeedEntry[] = DSM5_SEED) {}

  async seed(): Promise<number> {
    if (this.entries.length === 0) {
      return 0;
    }
    await DiagnosisCatalogModel.bulkWrite(
      this.entries.map((entry) => ({
        updateOne: {
          filter: { _id: entry.code },
          update: { $set: { name: entry.name, category: entry.category, active: true } },
          upsert: true,
        },
      })),
    );
    return this.entries.length;
  }
}
