import { ValidationError } from '#core/errors/ApplicationError';
import type { AuditEvent } from './AuditEvent';
import type { AuditCursor, AuditEventRepository } from './AuditEventRepository';

export interface AuditQuery {
  category?: string;
  from?: Date;
  to?: Date;
  before?: AuditCursor;
  limit?: number;
}

export interface AuditPage {
  events: AuditEvent[];
  nextBefore: AuditCursor | null;
}

export class AuditService {
  static readonly DEFAULT_LIMIT = 50;
  static readonly MAX_LIMIT = 200;

  constructor(private readonly events: AuditEventRepository) {}

  async list(professionalId: string, query: AuditQuery): Promise<AuditPage> {
    if (query.from && query.to && query.to.getTime() <= query.from.getTime()) {
      throw new ValidationError('`to` must be after `from`', { field: 'to' });
    }
    const limit = Math.min(
      Math.max(query.limit ?? AuditService.DEFAULT_LIMIT, 1),
      AuditService.MAX_LIMIT,
    );
    const found = await this.events.search(professionalId, {
      category: query.category ?? null,
      from: query.from ?? null,
      to: query.to ?? null,
      before: query.before ?? null,
      limit: limit + 1,
    });
    const events = found.slice(0, limit);
    const last = events.at(-1);
    return {
      events,
      nextBefore:
        found.length > limit && last ? { occurredAt: last.occurredAt, id: last.id } : null,
    };
  }
}
