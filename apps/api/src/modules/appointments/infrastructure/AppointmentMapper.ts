import type { DataMapper } from '#core/model/DataMapper';
import { Appointment } from '../model/Appointment';
import type { AppointmentDocument } from './AppointmentSchema';

// Data Mapper
export class AppointmentMapper implements DataMapper<Appointment, AppointmentDocument> {
  toDomain(record: AppointmentDocument): Appointment {
    return Appointment.restore(record._id, {
      professionalId: record.professionalId,
      patientId: record.patientId,
      startsAt: record.startsAt,
      durationMinutes: record.durationMinutes,
      type: record.type,
      modality: record.modality,
      status: record.status,
      notes: record.notes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      cancelledAt: record.cancelledAt,
      reminderSentAt: record.reminderSentAt ?? null,
    });
  }

  toPersistence(appointment: Appointment): AppointmentDocument {
    return {
      _id: appointment.id,
      professionalId: appointment.professionalId,
      patientId: appointment.patientId,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      durationMinutes: appointment.durationMinutes,
      type: appointment.type,
      modality: appointment.modality,
      status: appointment.status,
      notes: appointment.notes,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      cancelledAt: appointment.cancelledAt,
      reminderSentAt: appointment.reminderSentAt,
    };
  }
}
