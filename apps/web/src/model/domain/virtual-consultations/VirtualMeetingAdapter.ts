import type { VirtualMeetingDto } from '@mentora/contracts';
import { translate as t } from '@/shared/i18n';
import { Formats } from '../format/Formats';

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

// Adapter
export class VirtualMeetingAdapter {
  static toItem(dto: VirtualMeetingDto): VirtualMeetingItem {
    return {
      id: dto.id,
      joinUrl: dto.joinUrl,
      when: Formats.date(dto.createdAt, 'dateTime'),
      providerLabel: PROVIDER[dto.provider],
      origin: t(dto.appointmentId ? 'meetings.origin.appointment' : 'meetings.origin.file'),
      invitationLabel: t(`meetings.invitation.${dto.invitationStatus}`),
    };
  }
}
