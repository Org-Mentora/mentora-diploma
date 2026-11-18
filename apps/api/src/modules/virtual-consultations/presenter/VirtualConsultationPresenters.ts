import type { View } from '#core/view/View';
import type {
  VirtualMeetingDto,
  VirtualMeetingPageDto,
} from '../contracts/virtual-consultations.contracts';
import type { VirtualConsultationService } from '../model/VirtualConsultationService';
import { ListVirtualMeetingsPresenter } from './ListVirtualMeetingsPresenter';
import { StartVirtualMeetingPresenter } from './StartVirtualMeetingPresenter';

// Abstract Factory
export class VirtualConsultationPresenters {
  constructor(private readonly virtualConsultationService: VirtualConsultationService) {}

  startVirtualMeeting(view: View<VirtualMeetingDto>) {
    return new StartVirtualMeetingPresenter(view, this.virtualConsultationService);
  }

  listVirtualMeetings(view: View<VirtualMeetingPageDto>) {
    return new ListVirtualMeetingsPresenter(view, this.virtualConsultationService);
  }
}
