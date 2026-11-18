import type { ClientSession, Model, QueryFilter } from 'mongoose';
import type { DataMapper } from '#core/model/DataMapper';
import type { Entity } from '#core/model/Entity';
import type { Page, PageRequest } from '#core/model/Pagination';
import { Repository } from '#core/model/Repository';
import type { Keyset } from './Keyset';
import type { TransactionContext } from './TransactionContext';

export interface FindManyOptions {
  sort?: Record<string, 1 | -1>;
  limit?: number;
}

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
    return this.findOneBy({ _id: id } as QueryFilter<TDocument>);
  }

  async save(entity: TEntity): Promise<void> {
    const document = this.mapper.toPersistence(entity);
    const filter = { _id: document._id } as QueryFilter<TDocument>;
    await this.model
      .replaceOne(filter, document, { upsert: true, session: this.session ?? undefined })
      .exec();
  }

  protected async findOneBy(filter: QueryFilter<TDocument>): Promise<TEntity | null> {
    const record = await this.model.findOne(filter).session(this.session).lean<TDocument>().exec();
    return record ? this.mapper.toDomain(record) : null;
  }

  protected async findManyBy(
    filter: QueryFilter<TDocument>,
    options: FindManyOptions = {},
  ): Promise<TEntity[]> {
    const query = this.model.find(filter).session(this.session);
    if (options.sort) {
      query.sort(options.sort);
    }
    if (options.limit !== undefined) {
      query.limit(options.limit);
    }
    const records = await query.lean<TDocument[]>().exec();
    return records.map((record) => this.mapper.toDomain(record));
  }

  protected async findPage(
    keyset: Keyset,
    filter: QueryFilter<TDocument>,
    page: PageRequest,
  ): Promise<Page<TEntity>> {
    const records = await this.model
      .find(keyset.where(filter, page.after) as QueryFilter<TDocument>)
      .sort(keyset.sort())
      .limit(page.limit + 1)
      .session(this.session)
      .lean<TDocument[]>()
      .exec();
    return keyset.page(records, page, (record) => this.mapper.toDomain(record));
  }
}
