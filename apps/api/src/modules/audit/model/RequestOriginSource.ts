import type { AuditOrigin } from './AuditEvent';

export abstract class RequestOriginSource {
  abstract current(): AuditOrigin | null;
}
