export type AuditActor = 'professional' | 'patient' | 'system';

export type AuditDetailValue = string | number | boolean | null;

export interface AuditTarget {
  type: string;
  id: string;
}

export interface AuditRecord {
  professionalId: string;
  action: string;
  actor?: AuditActor;
  target?: AuditTarget | null;
  details?: Record<string, AuditDetailValue>;
}

export abstract class AuditTrail {
  abstract record(entry: AuditRecord): Promise<void>;
}
