import type { Entity } from './Entity';

// Repository
export abstract class Repository<TEntity extends Entity<object, TId>, TId = string> {
  abstract findById(id: TId): Promise<TEntity | null>;
  abstract findAll(): Promise<TEntity[]>;
  abstract save(entity: TEntity): Promise<void>;
  abstract delete(id: TId): Promise<boolean>;
}
