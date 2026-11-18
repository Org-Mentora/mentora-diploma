import { CursorCodec, type PageInput } from '#core/presenter/CursorCodec';
import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { NotificationPageDto } from '../contracts/notifications.contracts';
import type { NotificationCenter } from '../model/NotificationCenter';

export interface ListNotificationsInput extends PageInput {
  actor: AuthenticatedActor;
  patientId: string;
}

// Presenter
export class ListNotificationsPresenter extends Presenter<
  ListNotificationsInput,
  NotificationPageDto,
  NotificationCenter
> {
  protected async execute(input: ListNotificationsInput): Promise<NotificationPageDto> {
    const page = await this.model.history(
      input.actor.professionalId,
      input.patientId,
      CursorCodec.request(input),
    );
    return CursorCodec.toDto(page, (n) => ({
      id: n.id,
      patientId: n.patientId,
      channel: n.channel,
      topic: n.topic,
      recipient: n.recipient,
      body: n.body,
      status: n.status,
      attempts: n.attempts,
      error: n.error,
      createdAt: n.createdAt.toISOString(),
    }));
  }
}
