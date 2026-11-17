import { TransactionManager } from '#core/model/TransactionManager';
import type { MongoConnection } from './MongoConnection';
import type { TransactionContext } from './TransactionContext';

// Unit of Work, Adapter
export class MongoTransactionManager extends TransactionManager {
  constructor(
    private readonly database: MongoConnection,
    private readonly context: TransactionContext,
  ) {
    super();
  }

  run<T>(work: () => Promise<T>): Promise<T> {
    if (this.context.isActive) {
      return work();
    }
    return this.database.connection.transaction((session) => this.context.runWith(session, work));
  }
}
