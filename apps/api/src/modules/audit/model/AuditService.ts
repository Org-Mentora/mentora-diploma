import { ValidationError } from '#core/errors/ApplicationError';
import type { Page, PageRequest } from '#core/model/Pagination';
import type { AuditEvent } from './AuditEvent';
import type { AuditEventRepository } from './AuditEventRepository';

export interface AuditQuery {
  category?: string | undefined;
  from?: Date | undefined;
  to?: Date | undefined;
}

export class AuditService {
  constructor(private readonly events: AuditEventRepository) {}

  async list(
    professionalId: string,
    query: AuditQuery,
    page: PageRequest,
  ): Promise<Page<AuditEvent>> {
    if (query.from && query.to && query.to.getTime() <= query.from.getTime()) {
      throw new ValidationError('`to` must be after `from`', { field: 'to' });
    }
    return this.events.search(
      professionalId,
      { category: query.category ?? null, from: query.from ?? null, to: query.to ?? null },
      page,
    );
  }
}
