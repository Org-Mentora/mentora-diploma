import type { Page, PageRequest } from '#core/model/Pagination';
import { Repository } from '#core/model/Repository';
import type { AuditEvent } from './AuditEvent';

export interface AuditEventFilter {
  category: string | null;
  from: Date | null;
  to: Date | null;
}

// Repository
export abstract class AuditEventRepository extends Repository<AuditEvent> {
  abstract search(
    professionalId: string,
    filter: AuditEventFilter,
    page: PageRequest,
  ): Promise<Page<AuditEvent>>;
}
