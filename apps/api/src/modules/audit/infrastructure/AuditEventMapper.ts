import type { DataMapper } from '#core/model/DataMapper';
import { AuditEvent } from '../model/AuditEvent';
import type { AuditEventDocument } from './AuditEventSchema';

// Data Mapper
export class AuditEventMapper implements DataMapper<AuditEvent, AuditEventDocument> {
  toDomain(record: AuditEventDocument): AuditEvent {
    const hasOrigin = record.ip !== null || record.userAgent !== null || record.requestId !== null;
    return AuditEvent.restore(record._id, {
      professionalId: record.professionalId,
      actor: record.actor,
      action: record.action,
      targetType: record.targetType,
      targetId: record.targetId,
      details: record.details ?? {},
      origin: hasOrigin
        ? { ip: record.ip, userAgent: record.userAgent, requestId: record.requestId }
        : null,
      occurredAt: record.occurredAt,
    });
  }

  toPersistence(event: AuditEvent): AuditEventDocument {
    return {
      _id: event.id,
      professionalId: event.professionalId,
      actor: event.actor,
      action: event.action,
      category: event.category,
      targetType: event.targetType,
      targetId: event.targetId,
      details: event.details,
      ip: event.origin?.ip ?? null,
      userAgent: event.origin?.userAgent ?? null,
      requestId: event.origin?.requestId ?? null,
      occurredAt: event.occurredAt,
    };
  }
}
