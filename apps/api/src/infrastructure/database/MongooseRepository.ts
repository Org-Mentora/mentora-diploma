import type { ClientSession, Model, QueryFilter } from 'mongoose';
import type { DataMapper } from '#core/model/DataMapper';
import type { Entity } from '#core/model/Entity';
import { Repository } from '#core/model/Repository';
import type { TransactionContext } from './TransactionContext';

export interface MongoDocument {
  _id: string;
}

// Repository, Adapter
export abstract class MongooseRepository<
  TEntity extends Entity<object>,
  TDocument extends MongoDocument,
> extends Repository<TEntity> {
  protected constructor(
    protected readonly model: Model<TDocument>,
    protected readonly mapper: DataMapper<TEntity, TDocument>,
    private readonly context: TransactionContext,
  ) {
    super();
  }

  protected get session(): ClientSession | null {
    return this.context.session;
  }

  async findById(id: string): Promise<TEntity | null> {
    const record = await this.model.findById(id).session(this.session).lean<TDocument>().exec();
    return record ? this.mapper.toDomain(record) : null;
  }

  async save(entity: TEntity): Promise<void> {
    const document = this.mapper.toPersistence(entity);
    const filter = { _id: document._id } as QueryFilter<TDocument>;
    await this.model
      .replaceOne(filter, document, { upsert: true, session: this.session ?? undefined })
      .exec();
  }
}
