import type { QueryFilter } from 'mongoose';
import type { Page, PageRequest } from '#core/model/Pagination';
import { Keyset } from '#infrastructure/database/Keyset';
import { MongooseRepository } from '#infrastructure/database/MongooseRepository';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { AuditEvent } from '../model/AuditEvent';
import type { AuditEventFilter, AuditEventRepository } from '../model/AuditEventRepository';
import { AuditEventMapper } from './AuditEventMapper';
import { type AuditEventDocument, AuditEventModel } from './AuditEventSchema';

const NEWEST_FIRST = Keyset.newestFirst('occurredAt');

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

  async search(
    professionalId: string,
    filter: AuditEventFilter,
    page: PageRequest,
  ): Promise<Page<AuditEvent>> {
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
    return this.findPage(NEWEST_FIRST, query, page);
  }
}
