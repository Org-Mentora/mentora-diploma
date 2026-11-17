import mongoose, { type Connection } from 'mongoose';

const DEFAULT_MAX_POOL_SIZE = 20;

// Singleton
export class MongoConnection {
  static #instance: MongoConnection | undefined;
  #connecting: Promise<void> | undefined;

  private constructor() {}

  static getInstance(): MongoConnection {
    MongoConnection.#instance ??= new MongoConnection();
    return MongoConnection.#instance;
  }

  connect(uri: string, maxPoolSize = DEFAULT_MAX_POOL_SIZE): Promise<void> {
    this.#connecting ??= this.open(uri, maxPoolSize).catch((error: unknown) => {
      this.#connecting = undefined;
      throw error;
    });
    return this.#connecting;
  }

  private async open(uri: string, maxPoolSize: number): Promise<void> {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5_000, maxPoolSize });
    await this.assertSupportsTransactions();
  }

  private async assertSupportsTransactions(): Promise<void> {
    const hello = await mongoose.connection.db?.admin().command({ hello: 1 });
    if (!hello?.setName && hello?.msg !== 'isdbgrid') {
      await mongoose.disconnect();
      throw new Error(
        'MongoDB must run as a replica set to support transactions (ADR-0025). ' +
          'Start it with `docker compose up -d mongo`.',
      );
    }
  }

  async disconnect(): Promise<void> {
    this.#connecting = undefined;
    await mongoose.disconnect();
  }

  get isConnected(): boolean {
    return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
  }

  get connection(): Connection {
    return mongoose.connection;
  }

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
