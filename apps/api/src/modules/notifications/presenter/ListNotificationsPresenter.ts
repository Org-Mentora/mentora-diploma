import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { NotificationDto } from '../contracts/notifications.contracts';
import type { NotificationCenter } from '../model/NotificationCenter';

export interface ListNotificationsInput {
  actor: AuthenticatedActor;
  patientId: string;
}

// Presenter
export class ListNotificationsPresenter extends Presenter<
  ListNotificationsInput,
  NotificationDto[]
> {
  constructor(
    view: View<NotificationDto[]>,
    private readonly center: NotificationCenter,
  ) {
    super(view);
  }

  protected async execute({
    actor,
    patientId,
  }: ListNotificationsInput): Promise<NotificationDto[]> {
    const notifications = await this.center.history(actor.professionalId, patientId);
    return notifications.map((n) => ({
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
