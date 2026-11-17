import type { AuditActor, AuditDetailValue } from '#core/model/AuditTrail';
import { Entity } from '#core/model/Entity';

export interface AuditOrigin {
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
}

export interface AuditEventProps {
  professionalId: string;
  actor: AuditActor;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, AuditDetailValue>;
  origin: AuditOrigin | null;
  occurredAt: Date;
}

// Entity
export class AuditEvent extends Entity<AuditEventProps> {
  static readonly ACTION_PATTERN = /^[a-z_]+\.[a-z_]+$/;

  static occur(id: string, props: AuditEventProps): AuditEvent {
    if (!AuditEvent.ACTION_PATTERN.test(props.action)) {
      throw new Error(`Invalid audit action '${props.action}'`);
    }
    return new AuditEvent(id, { ...props, details: { ...props.details } });
  }

  static restore(id: string, props: AuditEventProps): AuditEvent {
    return new AuditEvent(id, props);
  }

  static categoryOf(action: string): string {
    return action.split('.')[0] ?? action;
  }

  get professionalId(): string {
    return this.props.professionalId;
  }

  get actor(): AuditActor {
    return this.props.actor;
  }

  get action(): string {
    return this.props.action;
  }

  get category(): string {
    return AuditEvent.categoryOf(this.props.action);
  }

  get targetType(): string | null {
    return this.props.targetType;
  }

  get targetId(): string | null {
    return this.props.targetId;
  }

  get details(): Record<string, AuditDetailValue> {
    return { ...this.props.details };
  }

  get origin(): AuditOrigin | null {
    return this.props.origin;
  }

  get occurredAt(): Date {
    return this.props.occurredAt;
  }
}
