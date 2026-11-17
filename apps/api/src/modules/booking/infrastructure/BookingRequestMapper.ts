import type { DataMapper } from '#core/model/DataMapper';
import { BookingRequest } from '../model/BookingRequest';
import type { BookingRequestDocument } from './BookingRequestSchema';

// Data Mapper
export class BookingRequestMapper implements DataMapper<BookingRequest, BookingRequestDocument> {
  toDomain(record: BookingRequestDocument): BookingRequest {
    return BookingRequest.restore(record._id, {
      professionalId: record.professionalId,
      requester: { ...record.requester },
      startsAt: record.startsAt,
      durationMinutes: record.durationMinutes,
      modality: record.modality,
      reason: record.reason,
      status: record.status,
      patientId: record.patientId,
      appointmentId: record.appointmentId,
      rejectionReason: record.rejectionReason,
      createdAt: record.createdAt,
      decidedAt: record.decidedAt,
    });
  }

  toPersistence(request: BookingRequest): BookingRequestDocument {
    return {
      _id: request.id,
      professionalId: request.professionalId,
      requester: request.requester,
      startsAt: request.startsAt,
      endsAt: request.endsAt,
      durationMinutes: request.durationMinutes,
      modality: request.modality,
      reason: request.reason,
      status: request.status,
      patientId: request.patientId,
      appointmentId: request.appointmentId,
      rejectionReason: request.rejectionReason,
      createdAt: request.createdAt,
      decidedAt: request.decidedAt,
    };
  }
}
