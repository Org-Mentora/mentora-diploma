import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
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
  VirtualMeetingDto,
  VirtualConsultationService
> {
  protected async execute({ actor, data }: StartVirtualMeetingInput): Promise<VirtualMeetingDto> {
    const meeting = await this.model.start(actor.professionalId, {
      patientId: data.patientId,
      appointmentId: data.appointmentId ?? null,
    });
    return VirtualMeetingViewModel.toDto(meeting);
  }
}
