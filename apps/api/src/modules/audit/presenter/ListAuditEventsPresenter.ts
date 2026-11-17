import { ValidationError } from '#core/errors/ApplicationError';
import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { AuditEventPageDto, ListAuditEventsQueryDto } from '../contracts/audit.contracts';
import type { AuditEvent } from '../model/AuditEvent';
import type { AuditService } from '../model/AuditService';

export interface ListAuditEventsInput {
  actor: AuthenticatedActor;
  query: ListAuditEventsQueryDto;
}

const date = (value: string | undefined) => (value ? new Date(value) : undefined);

// Presenter
export class ListAuditEventsPresenter extends Presenter<ListAuditEventsInput, AuditEventPageDto> {
  constructor(
    view: View<AuditEventPageDto>,
    private readonly audit: AuditService,
  ) {
    super(view);
  }

  protected async execute({ actor, query }: ListAuditEventsInput): Promise<AuditEventPageDto> {
    const page = await this.audit.list(actor.professionalId, {
      category: query.category,
      from: date(query.from),
      to: date(query.to),
      before: ListAuditEventsPresenter.cursor(query.before),
      limit: query.limit,
    });
    return {
      items: page.events.map(ListAuditEventsPresenter.toDto),
      nextBefore: page.nextBefore
        ? `${page.nextBefore.occurredAt.toISOString()}_${page.nextBefore.id}`
        : null,
    };
  }

  private static cursor(value: string | undefined) {
    if (!value) {
      return undefined;
    }
    const [at, id] = value.split('_') as [string, string];
    const occurredAt = new Date(at);
    if (Number.isNaN(occurredAt.getTime())) {
      throw new ValidationError('Invalid cursor', { field: 'before' });
    }
    return { occurredAt, id };
  }

  private static toDto(event: AuditEvent) {
    return {
      id: event.id,
      action: event.action,
      category: event.category,
      actor: event.actor,
      targetType: event.targetType,
      targetId: event.targetId,
      details: event.details,
      ip: event.origin?.ip ?? null,
      userAgent: event.origin?.userAgent ?? null,
      occurredAt: event.occurredAt.toISOString(),
    };
  }
}
