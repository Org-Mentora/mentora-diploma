import type { AppointmentModality, AppointmentType } from './Appointment';
import type { AppointmentService, BusyInterval } from './AppointmentService';

export interface BookedSlot {
  startsAt: Date;
  durationMinutes: number;
  type: AppointmentType;
  modality: AppointmentModality;
  notes: string | null;
}

export class AppointmentBooking {
  constructor(private readonly agenda: AppointmentService) {}

  busyIntervals(professionalId: string, from: Date, to: Date): Promise<BusyInterval[]> {
    return this.agenda.busyIntervals(professionalId, from, to);
  }

  async book(professionalId: string, patientId: string, slot: BookedSlot): Promise<string> {
    return (await this.agenda.book(professionalId, patientId, slot)).id;
  }

  confirm(professionalId: string, appointmentId: string): Promise<void> {
    return this.agenda.confirmBooked(professionalId, appointmentId);
  }
}
