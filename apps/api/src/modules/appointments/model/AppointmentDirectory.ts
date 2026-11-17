import type { AppointmentModality, AppointmentStatus } from './Appointment';
import type { AppointmentRepository } from './AppointmentRepository';

export interface AppointmentSummary {
  id: string;
  patientId: string;
  startsAt: Date;
  modality: AppointmentModality;
  status: AppointmentStatus;
}

export class AppointmentDirectory {
  constructor(private readonly appointments: AppointmentRepository) {}

  async findOwned(
    professionalId: string,
    appointmentId: string,
  ): Promise<AppointmentSummary | null> {
    const appointment = await this.appointments.findOwned(professionalId, appointmentId);
    return appointment
      ? {
          id: appointment.id,
          patientId: appointment.patientId,
          startsAt: appointment.startsAt,
          modality: appointment.modality,
          status: appointment.status,
        }
      : null;
  }
}
