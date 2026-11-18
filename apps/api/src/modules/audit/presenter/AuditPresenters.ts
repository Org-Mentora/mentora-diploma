import type { View } from '#core/view/View';
import type { AuditEventPageDto } from '../contracts/audit.contracts';
import type { AuditService } from '../model/AuditService';
import { ListAuditEventsPresenter } from './ListAuditEventsPresenter';

// Abstract Factory
export class AuditPresenters {
  constructor(private readonly auditService: AuditService) {}

  listAuditEvents(view: View<AuditEventPageDto>) {
    return new ListAuditEventsPresenter(view, this.auditService);
  }
}
