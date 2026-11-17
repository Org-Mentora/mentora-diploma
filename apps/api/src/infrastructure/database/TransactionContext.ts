import { AsyncLocalStorage } from 'node:async_hooks';
import type { ClientSession } from 'mongoose';

export class TransactionContext {
  readonly #storage = new AsyncLocalStorage<ClientSession>();

  get session(): ClientSession | null {
    return this.#storage.getStore() ?? null;
  }

  get isActive(): boolean {
    return this.session !== null;
  }

  runWith<T>(session: ClientSession, work: () => Promise<T>): Promise<T> {
    return this.#storage.run(session, work);
  }
}
