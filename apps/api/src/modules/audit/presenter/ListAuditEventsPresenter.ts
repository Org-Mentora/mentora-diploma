import { CursorCodec } from '#core/presenter/CursorCodec';
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
    const page = await this.audit.list(
      actor.professionalId,
      { category: query.category, from: date(query.from), to: date(query.to) },
      CursorCodec.request(query),
    );
    return CursorCodec.toDto(page, ListAuditEventsPresenter.toDto);
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
