import type { Model, QueryFilter } from 'mongoose';
import type { DataMapper } from '#core/model/DataMapper';
import type { Entity } from '#core/model/Entity';
import { Repository } from '#core/model/Repository';

/** Every persisted document uses the entity id (a UUID string) as `_id`. */
export interface MongoDocument {
  _id: string;
}

/**
 * Adapter (ADR-0007): implements the Model's `Repository` contract on top of a Mongoose
 * model. Module repositories extend it, pass their model + mapper and add custom queries.
 */
export abstract class MongooseRepository<
  TEntity extends Entity<object>,
  TDocument extends MongoDocument,
> extends Repository<TEntity> {
  protected constructor(
    protected readonly model: Model<TDocument>,
    protected readonly mapper: DataMapper<TEntity, TDocument>,
  ) {
    super();
  }

  async findById(id: string): Promise<TEntity | null> {
    const record = await this.model.findById(id).lean<TDocument>().exec();
    return record ? this.mapper.toDomain(record) : null;
  }

  async findAll(): Promise<TEntity[]> {
    const records = await this.model.find().lean<TDocument[]>().exec();
    return records.map((record) => this.mapper.toDomain(record));
  }

  async save(entity: TEntity): Promise<void> {
    const document = this.mapper.toPersistence(entity);
    const filter = { _id: document._id } as QueryFilter<TDocument>;
    await this.model.replaceOne(filter, document, { upsert: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: id } as QueryFilter<TDocument>).exec();
    return result.deletedCount > 0;
  }
}
