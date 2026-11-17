import type { Entity } from './Entity';

// Repository
export abstract class Repository<TEntity extends Entity<object, TId>, TId = string> {
  abstract findById(id: TId): Promise<TEntity | null>;
  abstract save(entity: TEntity): Promise<void>;
}
