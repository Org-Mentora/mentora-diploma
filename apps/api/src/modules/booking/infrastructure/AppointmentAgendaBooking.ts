import type { AppointmentBooking } from '#modules/appointments';
import { AgendaBooking, type AgendaSlot } from '../model/AgendaBooking';
import type { Interval } from '../model/SlotPlanner';

// Adapter
export class AppointmentAgendaBooking extends AgendaBooking {
  constructor(private readonly appointments: AppointmentBooking) {
    super();
  }

  busyIntervals(professionalId: string, from: Date, to: Date): Promise<Interval[]> {
    return this.appointments.busyIntervals(professionalId, from, to);
  }

  book(professionalId: string, patientId: string, slot: AgendaSlot): Promise<string> {
    return this.appointments.book(professionalId, patientId, slot);
  }

  confirm(professionalId: string, appointmentId: string): Promise<void> {
    return this.appointments.confirm(professionalId, appointmentId);
  }
}
