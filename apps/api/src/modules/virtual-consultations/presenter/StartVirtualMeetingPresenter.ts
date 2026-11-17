import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type {
  StartVirtualMeetingRequestDto,
  VirtualMeetingDto,
} from '../contracts/virtual-consultations.contracts';
import type { VirtualConsultationService } from '../model/VirtualConsultationService';
import { VirtualMeetingViewModel } from './VirtualMeetingViewModel';

export interface StartVirtualMeetingInput {
  actor: AuthenticatedActor;
  data: StartVirtualMeetingRequestDto;
}

// Presenter
export class StartVirtualMeetingPresenter extends Presenter<
  StartVirtualMeetingInput,
  VirtualMeetingDto
> {
  constructor(
    view: View<VirtualMeetingDto>,
    private readonly consultations: VirtualConsultationService,
  ) {
    super(view);
  }

  protected async execute({ actor, data }: StartVirtualMeetingInput): Promise<VirtualMeetingDto> {
    const meeting = await this.consultations.start(actor.professionalId, {
      patientId: data.patientId,
      appointmentId: data.appointmentId ?? null,
    });
    return VirtualMeetingViewModel.toDto(meeting);
  }
}
