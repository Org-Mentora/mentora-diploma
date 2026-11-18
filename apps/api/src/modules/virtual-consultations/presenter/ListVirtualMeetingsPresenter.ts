import { CursorCodec } from '#core/presenter/CursorCodec';
import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type {
  ListVirtualMeetingsQueryDto,
  VirtualMeetingPageDto,
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
  VirtualMeetingPageDto
> {
  constructor(
    view: View<VirtualMeetingPageDto>,
    private readonly consultations: VirtualConsultationService,
  ) {
    super(view);
  }

  protected async execute({
    actor,
    query,
  }: ListVirtualMeetingsInput): Promise<VirtualMeetingPageDto> {
    const page = query.appointmentId
      ? await this.consultations.forAppointment(actor.professionalId, query.appointmentId)
      : await this.consultations.history(
          actor.professionalId,
          query.patientId ?? '',
          CursorCodec.request(query),
        );
    return CursorCodec.toDto(page, VirtualMeetingViewModel.toDto);
  }
}
