import mongoose, { type Connection } from 'mongoose';

/**
 * Singleton (ADR-0006): owns the single Mongoose connection of the process.
 * Repositories never call `mongoose.connect` themselves.
 */
export class MongoConnection {
  static #instance: MongoConnection | undefined;

  private constructor() {}

  static getInstance(): MongoConnection {
    MongoConnection.#instance ??= new MongoConnection();
    return MongoConnection.#instance;
  }

  async connect(uri: string): Promise<void> {
    if (this.isConnected) {
      return;
    }
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5_000 });
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
  }

  get isConnected(): boolean {
    return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
  }

  get connection(): Connection {
    return mongoose.connection;
  }

  /** Round-trips a `ping` command and returns its latency in milliseconds. */
  async ping(): Promise<number> {
    const db = mongoose.connection.db;
    if (!this.isConnected || !db) {
      throw new Error('MongoDB is not connected');
    }
    const startedAt = performance.now();
    await db.admin().ping();
    return Math.round(performance.now() - startedAt);
  }
}
