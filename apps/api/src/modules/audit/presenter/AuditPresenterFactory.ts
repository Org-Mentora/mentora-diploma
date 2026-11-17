import type { View } from '#core/view/View';
import type { AuditEventPageDto } from '../contracts/audit.contracts';
import type { ListAuditEventsPresenter } from './ListAuditEventsPresenter';

// Abstract Factory
export interface AuditPresenterFactory {
  listAuditEvents(view: View<AuditEventPageDto>): ListAuditEventsPresenter;
}
