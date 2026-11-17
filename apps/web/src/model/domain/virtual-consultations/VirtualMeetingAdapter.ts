import type { VirtualMeetingDto } from '@mentora/contracts';

export interface VirtualMeetingItem {
  id: string;
  joinUrl: string;
  when: string;
  providerLabel: string;
  origin: string;
  invitationLabel: string;
}

const PROVIDER: Record<VirtualMeetingDto['provider'], string> = {
  jitsi: 'Jitsi Meet',
  google_meet: 'Google Meet',
};

const INVITATION: Record<VirtualMeetingDto['invitationStatus'], string> = {
  pending: 'Sending the link to the patient…',
  sent: 'The link was sent to the patient by WhatsApp.',
  failed: 'The link could not be sent. Share it with the patient manually.',
  skipped: 'The patient has no phone number. Share the link manually.',
};

const dateTime = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

// Adapter
export class VirtualMeetingAdapter {
  static toItem(dto: VirtualMeetingDto): VirtualMeetingItem {
    return {
      id: dto.id,
      joinUrl: dto.joinUrl,
      when: dateTime.format(new Date(dto.createdAt)),
      providerLabel: PROVIDER[dto.provider],
      origin: dto.appointmentId ? 'Virtual appointment' : 'From the patient file',
      invitationLabel: INVITATION[dto.invitationStatus],
    };
  }
}
