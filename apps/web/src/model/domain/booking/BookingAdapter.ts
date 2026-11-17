import type {
  AvailableSlotsDto,
  BookingRequestDto,
  BookingSettingsDto,
  PublicBookingPageDto,
} from '@mentora/contracts';
import { translate as t } from '@/shared/i18n';
import { modalityLabel } from '../appointments/AgendaAdapter';
import { Formats } from '../format/Formats';
import { PatientAdapter } from '../patients/PatientAdapter';

export type BookingRequestStatus = BookingRequestDto['status'];
export type BookingTone = 'warning' | 'success' | 'secondary' | 'danger';

export interface BookingRequestItem {
  id: string;
  requesterName: string;
  dniLabel: string;
  contact: string;
  when: string;
  modalityLabel: string;
  reason: string | null;
  isNewPatient: boolean;
  status: BookingRequestStatus;
  statusLabel: string;
  statusTone: BookingTone;
  isPending: boolean;
  decision: string | null;
}

export interface SlotOption {
  startsAt: string;
  label: string;
  fullLabel: string;
}

export interface SlotDay {
  date: string;
  label: string;
  slots: SlotOption[];
}

export interface PublicPageModel {
  professionalName: string;
  specialty: string;
  offices: string[];
  instructions: string | null;
  durationLabel: string;
  timezoneNote: string;
  modalities: { value: 'in_person' | 'virtual'; label: string }[];
  horizonDays: number;
}

export interface BookingSettingsSummary {
  slug: string;
  timezone: string;
  publicPath: string;
}

const TONE: Record<BookingRequestStatus, BookingTone> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'danger',
  expired: 'secondary',
};

// Adapter
export class BookingAdapter {
  static statusLabel(status: BookingRequestStatus): string {
    return t(`booking.status.${status}`);
  }

  static toRequestItem(dto: BookingRequestDto, timeZone?: string): BookingRequestItem {
    const { requester } = dto;
    const decision =
      dto.status === 'rejected' && dto.rejectionReason
        ? t('booking.requests.rejectedBecause', { reason: dto.rejectionReason })
        : dto.decidedAt
          ? t('booking.requests.decidedAt', { date: Formats.date(dto.decidedAt, 'dateTime') })
          : null;
    return {
      id: dto.id,
      requesterName: `${requester.firstName} ${requester.lastName}`,
      dniLabel: `DNI ${PatientAdapter.formatDni(requester.dni)}`,
      contact: [requester.phone, requester.email].filter(Boolean).join(' · '),
      when: `${Formats.date(dto.startsAt, 'dateTime', timeZone)} · ${dto.durationMinutes} min`,
      modalityLabel: modalityLabel(dto.modality),
      reason: dto.reason,
      isNewPatient: dto.existingPatientId === null,
      status: dto.status,
      statusLabel: BookingAdapter.statusLabel(dto.status),
      statusTone: TONE[dto.status],
      isPending: dto.status === 'pending',
      decision,
    };
  }

  static toSummary(dto: BookingSettingsDto): BookingSettingsSummary {
    return { slug: dto.slug, timezone: dto.timezone, publicPath: `/book/${dto.slug}` };
  }

  static toPublicPage(dto: PublicBookingPageDto): PublicPageModel {
    return {
      professionalName: dto.professional.fullName,
      specialty: dto.professional.specialty,
      offices: dto.professional.offices,
      instructions: dto.instructions,
      durationLabel: t('booking.public.duration', { minutes: dto.slotMinutes }),
      timezoneNote: t('booking.public.timezone', { timezone: dto.timezone }),
      modalities: dto.modalities.map((value) => ({ value, label: modalityLabel(value) })),
      horizonDays: dto.horizonDays,
    };
  }

  static toSlotDays(dto: AvailableSlotsDto): SlotDay[] {
    return dto.days.map((day) => ({
      date: day.date,
      label: Formats.dayHeading(day.date),
      slots: day.slots.map((startsAt) => ({
        startsAt,
        label: Formats.date(startsAt, 'time', dto.timezone),
        fullLabel: Formats.date(startsAt, 'dateTime', dto.timezone),
      })),
    }));
  }

  static receipt(startsAt: string, timeZone: string): string {
    return Formats.date(startsAt, 'dateTime', timeZone);
  }
}
