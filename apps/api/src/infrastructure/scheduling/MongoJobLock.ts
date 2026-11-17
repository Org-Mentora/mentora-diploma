import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { JobLock } from '#core/scheduling/JobLock';

interface LockDocument {
  _id: string;
  owner: string;
  lockedUntil: Date;
}

const DUPLICATE_KEY = 11000;

// Adapter
export class MongoJobLock extends JobLock {
  readonly owner = randomUUID();

  private get locks() {
    return mongoose.connection.collection<LockDocument>('job_locks');
  }

  async acquire(job: string, leaseMs: number): Promise<boolean> {
    const now = new Date();
    try {
      const result = await this.locks.updateOne(
        { _id: job, $or: [{ lockedUntil: { $lte: now } }, { owner: this.owner }] },
        { $set: { owner: this.owner, lockedUntil: new Date(now.getTime() + leaseMs) } },
        { upsert: true },
      );
      return result.modifiedCount + result.upsertedCount > 0;
    } catch (error) {
      if ((error as { code?: number }).code === DUPLICATE_KEY) {
        return false;
      }
      throw error;
    }
  }

  async release(job: string): Promise<void> {
    await this.locks.updateOne(
      { _id: job, owner: this.owner },
      { $set: { lockedUntil: new Date(0) } },
    );
  }
}
