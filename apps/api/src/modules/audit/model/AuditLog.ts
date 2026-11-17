import { type AuditRecord, AuditTrail } from '#core/model/AuditTrail';
import type { Clock } from '#core/model/Clock';
import type { IdGenerator } from '#core/model/IdGenerator';
import { AuditEvent } from './AuditEvent';
import type { AuditEventRepository } from './AuditEventRepository';
import type { RequestOriginSource } from './RequestOriginSource';

// Adapter
export class AuditLog extends AuditTrail {
  constructor(
    private readonly events: AuditEventRepository,
    private readonly origins: RequestOriginSource,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {
    super();
  }

  async record(entry: AuditRecord): Promise<void> {
    await this.events.save(
      AuditEvent.occur(this.ids.next(), {
        professionalId: entry.professionalId,
        actor: entry.actor ?? 'professional',
        action: entry.action,
        targetType: entry.target?.type ?? null,
        targetId: entry.target?.id ?? null,
        details: entry.details ?? {},
        origin: this.origins.current(),
        occurredAt: this.clock.now(),
      }),
    );
  }
}
