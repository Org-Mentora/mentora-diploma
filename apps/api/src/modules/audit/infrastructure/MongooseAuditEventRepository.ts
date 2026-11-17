import type { QueryFilter } from 'mongoose';
import { MongooseRepository } from '#infrastructure/database/MongooseRepository';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { AuditEvent } from '../model/AuditEvent';
import type { AuditEventFilter, AuditEventRepository } from '../model/AuditEventRepository';
import { AuditEventMapper } from './AuditEventMapper';
import { type AuditEventDocument, AuditEventModel } from './AuditEventSchema';

// Repository, Adapter
export class MongooseAuditEventRepository
  extends MongooseRepository<AuditEvent, AuditEventDocument>
  implements AuditEventRepository
{
  constructor(context: TransactionContext) {
    super(AuditEventModel, new AuditEventMapper(), context);
  }

  override async save(event: AuditEvent): Promise<void> {
    await this.model.create([this.mapper.toPersistence(event)], {
      session: this.session ?? undefined,
    });
  }

  async search(professionalId: string, filter: AuditEventFilter): Promise<AuditEvent[]> {
    const occurredAt: Record<string, Date> = {};
    if (filter.from) {
      occurredAt.$gte = filter.from;
    }
    if (filter.to) {
      occurredAt.$lt = filter.to;
    }
    const query: QueryFilter<AuditEventDocument> = { professionalId };
    if (filter.category) {
      query.category = filter.category;
    }
    if (Object.keys(occurredAt).length > 0) {
      query.occurredAt = occurredAt;
    }
    if (filter.before) {
      query.$or = [
        { occurredAt: { $lt: filter.before.occurredAt } },
        { occurredAt: filter.before.occurredAt, _id: { $lt: filter.before.id } },
      ];
    }
    const records = await this.model
      .find(query)
      .sort({ occurredAt: -1, _id: -1 })
      .limit(filter.limit)
      .session(this.session)
      .lean<AuditEventDocument[]>();
    return records.map((record) => this.mapper.toDomain(record));
  }
}
