import { DiagnosisCatalogSeeder } from '../model/DiagnosisCatalogSeeder';
import { DiagnosisCatalogModel } from './DiagnosisCatalogSchema';
import { DSM5_SEED, type Dsm5SeedEntry } from './dsm5Seed';

/**
 * Adapter (ADR-0007): loads the DSM-5 catalog into MongoDB. Every entry is upserted by code,
 * so editing `dsm5Seed.ts` and restarting keeps the catalog in sync.
 */
export class MongooseDiagnosisCatalogSeeder extends DiagnosisCatalogSeeder {
  constructor(private readonly entries: readonly Dsm5SeedEntry[] = DSM5_SEED) {
    super();
  }

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
