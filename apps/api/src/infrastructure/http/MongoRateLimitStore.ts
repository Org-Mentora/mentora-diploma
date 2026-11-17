import mongoose from 'mongoose';
import { RateLimitStore, type RateLimitWindow } from './RateLimitStore';

interface WindowDocument {
  _id: string;
  count: number;
  resetsAt: Date;
}

const DUPLICATE_KEY = 11000;

// Adapter
export class MongoRateLimitStore extends RateLimitStore {
  static readonly COLLECTION = 'rate_limits';
  #indexed: Promise<string> | undefined;

  private get windows() {
    return mongoose.connection.collection<WindowDocument>(MongoRateLimitStore.COLLECTION);
  }

  async hit(id: string, windowMs: number, now: number): Promise<RateLimitWindow> {
    this.#indexed ??= this.windows.createIndex({ resetsAt: 1 }, { expireAfterSeconds: 0 });
    await this.#indexed;
    try {
      return await this.increment(id, windowMs, now);
    } catch (error) {
      if ((error as { code?: number }).code === DUPLICATE_KEY) {
        return this.increment(id, windowMs, now);
      }
      throw error;
    }
  }

  private async increment(id: string, windowMs: number, now: number): Promise<RateLimitWindow> {
    const open = { $gt: ['$resetsAt', new Date(now)] };
    const window = await this.windows.findOneAndUpdate(
      { _id: id },
      [
        {
          $set: {
            count: { $cond: [open, { $add: ['$count', 1] }, 1] },
            resetsAt: { $cond: [open, '$resetsAt', new Date(now + windowMs)] },
          },
        },
      ],
      { upsert: true, returnDocument: 'after' },
    );
    if (!window) {
      throw new Error(`Rate limit window ${id} was not stored`);
    }
    return { count: window.count, resetsAt: window.resetsAt.getTime() };
  }
}
