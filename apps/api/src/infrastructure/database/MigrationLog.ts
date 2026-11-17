import type { MongoConnection } from './MongoConnection';

interface MigrationRecord {
  _id: string;
  ranAt: Date;
}

export class MigrationLog {
  static readonly COLLECTION = 'migrations';

  constructor(private readonly database: MongoConnection) {}

  async runOnce(name: string, work: () => Promise<unknown>): Promise<boolean> {
    const migrations = this.database.connection.collection<MigrationRecord>(
      MigrationLog.COLLECTION,
    );
    if (await migrations.findOne({ _id: name })) {
      return false;
    }
    await work();
    await migrations.updateOne(
      { _id: name },
      { $setOnInsert: { ranAt: new Date() } },
      { upsert: true },
    );
    return true;
  }
}
