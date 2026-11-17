import type { BookingModality } from './BookingPage';
import type { Interval } from './SlotPlanner';

export type BookedType = 'first_visit' | 'control' | 'follow_up' | 'medication' | 'other';

export interface AgendaSlot {
  startsAt: Date;
  durationMinutes: number;
  type: BookedType;
  modality: BookingModality;
  notes: string | null;
}

export abstract class AgendaBooking {
  abstract busyIntervals(professionalId: string, from: Date, to: Date): Promise<Interval[]>;
  abstract book(professionalId: string, patientId: string, slot: AgendaSlot): Promise<string>;
  abstract confirm(professionalId: string, appointmentId: string): Promise<void>;
}
