import mongoose from 'mongoose';

interface MigrationRecord {
  _id: string;
  ranAt: Date;
}

export class MigrationLog {
  static readonly COLLECTION = 'migrations';

  async runOnce(name: string, work: () => Promise<unknown>): Promise<boolean> {
    const migrations = mongoose.connection.collection<MigrationRecord>(MigrationLog.COLLECTION);
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
