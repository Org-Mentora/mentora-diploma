import type {
  BookingRequestDto,
  BookingSettingsDto,
  PublicBookingPageDto,
} from '../contracts/booking.contracts';
import type { BookingPage } from '../model/BookingPage';
import type { PublicBookingPage, RequestEntry } from '../model/BookingService';

export class BookingViewModel {
  static settings(page: BookingPage, timezone: string): BookingSettingsDto {
    return { slug: page.slug, timezone, ...page.settings };
  }

  static publicPage({ page, profile }: PublicBookingPage, timezone: string): PublicBookingPageDto {
    return {
      slug: page.slug,
      professional: {
        fullName: profile.fullName,
        specialty: profile.specialty,
        offices: [...profile.offices],
      },
      slotMinutes: page.slotMinutes,
      horizonDays: page.horizonDays,
      modalities: page.modalities,
      instructions: page.instructions,
      timezone,
    };
  }

  static request({ request, existingPatientId }: RequestEntry): BookingRequestDto {
    const { requester } = request;
    return {
      id: request.id,
      requester: {
        firstName: requester.firstName,
        lastName: requester.lastName,
        dni: requester.dni,
        birthDate: requester.birthDate?.toISOString().slice(0, 10) ?? null,
        phone: requester.phone,
        email: requester.email,
      },
      existingPatientId,
      startsAt: request.startsAt.toISOString(),
      endsAt: request.endsAt.toISOString(),
      durationMinutes: request.durationMinutes,
      modality: request.modality,
      reason: request.reason,
      status: request.status,
      appointmentId: request.appointmentId,
      rejectionReason: request.rejectionReason,
      createdAt: request.createdAt.toISOString(),
      decidedAt: request.decidedAt?.toISOString() ?? null,
    };
  }
}
