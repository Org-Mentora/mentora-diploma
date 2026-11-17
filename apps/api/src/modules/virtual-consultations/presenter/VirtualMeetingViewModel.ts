import type { VirtualMeetingDto } from '../contracts/virtual-consultations.contracts';
import type { VirtualMeeting } from '../model/VirtualMeeting';

export class VirtualMeetingViewModel {
  static toDto(meeting: VirtualMeeting): VirtualMeetingDto {
    return {
      id: meeting.id,
      patientId: meeting.patientId,
      appointmentId: meeting.appointmentId,
      provider: meeting.provider,
      joinUrl: meeting.joinUrl,
      invitationStatus: meeting.invitationStatus,
      invitationError: meeting.invitationError,
      createdAt: meeting.createdAt.toISOString(),
    };
  }
}
