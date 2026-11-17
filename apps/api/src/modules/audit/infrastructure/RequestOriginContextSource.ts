import type { RequestOriginContext } from '#infrastructure/http/RequestOriginContext';
import type { AuditOrigin } from '../model/AuditEvent';
import { RequestOriginSource } from '../model/RequestOriginSource';

// Adapter
export class RequestOriginContextSource extends RequestOriginSource {
  constructor(private readonly context: RequestOriginContext) {
    super();
  }

  current(): AuditOrigin | null {
    return this.context.current;
  }
}
