import type {
  AppointmentDto,
  RescheduleAppointmentRequestDto,
} from '../contracts/appointments.contracts';
import type { AgendaEntry, SlotRequest } from '../model/AppointmentService';

export class AppointmentViewModel {
  static toDto({ appointment, patientName }: AgendaEntry): AppointmentDto {
    return {
      id: appointment.id,
      patientId: appointment.patientId,
      patientName,
      startsAt: appointment.startsAt.toISOString(),
      endsAt: appointment.endsAt.toISOString(),
      durationMinutes: appointment.durationMinutes,
      type: appointment.type,
      modality: appointment.modality,
      status: appointment.status,
      notes: appointment.notes,
      fee: appointment.fee,
      source: appointment.source,
      cancelledAt: appointment.cancelledAt?.toISOString() ?? null,
    };
  }

  static toSlot(input: RescheduleAppointmentRequestDto): SlotRequest {
    return {
      startsAt: new Date(input.startsAt),
      durationMinutes: input.durationMinutes,
      type: input.type,
      modality: input.modality,
      notes: input.notes ?? null,
      fee: input.fee,
    };
  }
}
