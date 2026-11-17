import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type {
  ListVirtualMeetingsQueryDto,
  VirtualMeetingDto,
} from '../contracts/virtual-consultations.contracts';
import type { VirtualConsultationService } from '../model/VirtualConsultationService';
import { VirtualMeetingViewModel } from './VirtualMeetingViewModel';

export interface ListVirtualMeetingsInput {
  actor: AuthenticatedActor;
  query: ListVirtualMeetingsQueryDto;
}

// Presenter
export class ListVirtualMeetingsPresenter extends Presenter<
  ListVirtualMeetingsInput,
  VirtualMeetingDto[]
> {
  constructor(
    view: View<VirtualMeetingDto[]>,
    private readonly consultations: VirtualConsultationService,
  ) {
    super(view);
  }

  protected async execute({
    actor,
    query,
  }: ListVirtualMeetingsInput): Promise<VirtualMeetingDto[]> {
    const meetings = query.appointmentId
      ? await this.consultations.forAppointment(actor.professionalId, query.appointmentId)
      : await this.consultations.history(actor.professionalId, query.patientId ?? '');
    return meetings.map(VirtualMeetingViewModel.toDto);
  }
}
