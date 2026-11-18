import type { View } from '#core/view/View';
import type {
  VirtualMeetingDto,
  VirtualMeetingPageDto,
} from '../contracts/virtual-consultations.contracts';
import type { ListVirtualMeetingsPresenter } from './ListVirtualMeetingsPresenter';
import type { StartVirtualMeetingPresenter } from './StartVirtualMeetingPresenter';

// Abstract Factory
export interface VirtualConsultationPresenterFactory {
  startVirtualMeeting(view: View<VirtualMeetingDto>): StartVirtualMeetingPresenter;
  listVirtualMeetings(view: View<VirtualMeetingPageDto>): ListVirtualMeetingsPresenter;
}
