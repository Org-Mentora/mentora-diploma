import { Repository } from '#core/model/Repository';
import type { AuditEvent } from './AuditEvent';

export interface AuditCursor {
  occurredAt: Date;
  id: string;
}

export interface AuditEventFilter {
  category: string | null;
  from: Date | null;
  to: Date | null;
  before: AuditCursor | null;
  limit: number;
}

// Repository
export abstract class AuditEventRepository extends Repository<AuditEvent> {
  abstract search(professionalId: string, filter: AuditEventFilter): Promise<AuditEvent[]>;
}
