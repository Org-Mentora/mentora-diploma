import type { Entity } from './Entity';

/**
 * Persistence abstraction owned by the Model. Concrete implementations live in a module's
 * `infrastructure/` folder and adapt a driver (Mongoose) to this contract (ADR-0007).
 */
export abstract class Repository<TEntity extends Entity<object, TId>, TId = string> {
  abstract findById(id: TId): Promise<TEntity | null>;
  abstract findAll(): Promise<TEntity[]>;
  abstract save(entity: TEntity): Promise<void>;
  abstract delete(id: TId): Promise<boolean>;
}
