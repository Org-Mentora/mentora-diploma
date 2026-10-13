import type { AppointmentDto } from '@mentora/contracts';
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

export type AppointmentType = AppointmentDto['type'];
export type AppointmentModality = AppointmentDto['modality'];

export interface CalendarDay {
  key: string;
  date: Date;
  dayNumber: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  appointmentCount: number;
}

export interface AgendaItem {
  id: string;
  timeRange: string;
  patientName: string;
  typeLabel: string;
  modalityLabel: string;
  isCancelled: boolean;
  notes: string | null;
}

export const APPOINTMENT_TYPE_LABEL: Record<AppointmentType, string> = {
  first_visit: 'First visit',
  control: 'Control',
  follow_up: 'Follow-up',
  medication: 'Medication',
  other: 'Other',
};

export const MODALITY_LABEL: Record<AppointmentModality, string> = {
  in_person: 'In person',
  virtual: 'Virtual',
};

const WEEK = { weekStartsOn: 1 } as const;

/** Adapter (ADR-0007): appointments → calendar grid and day agenda (CU-10). */
export class AgendaAdapter {
  /** Visible range of the month grid: whole weeks, Monday first. */
  static monthRange(month: Date): { from: Date; to: Date } {
    const from = startOfWeek(startOfMonth(month), WEEK);
    const to = addDays(endOfWeek(endOfMonth(month), WEEK), 1);
    return { from: new Date(from.setHours(0, 0, 0, 0)), to: new Date(to.setHours(0, 0, 0, 0)) };
  }

  static monthTitle(month: Date): string {
    return format(month, 'MMMM yyyy');
  }

  static weekdayLabels(): string[] {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }

  /** CU-10 step 2: month grid with an indicator on days that have appointments. */
  static calendar(
    month: Date,
    appointments: AppointmentDto[],
    selectedDay: Date,
    today: Date,
  ): CalendarDay[][] {
    const { from, to } = AgendaAdapter.monthRange(month);
    const days = eachDayOfInterval({ start: from, end: addDays(to, -1) });
    const scheduled = appointments.filter((a) => a.status === 'scheduled');
    const cells = days.map((date) => ({
      key: format(date, 'yyyy-MM-dd'),
      date,
      dayNumber: date.getDate(),
      inMonth: isSameMonth(date, month),
      isToday: isSameDay(date, today),
      isSelected: isSameDay(date, selectedDay),
      appointmentCount: scheduled.filter((a) => isSameDay(new Date(a.startsAt), date)).length,
    }));
    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  }

  /** CU-10 step 5: the selected day's appointments, chronologically. */
  static dayAgenda(appointments: AppointmentDto[], day: Date): AgendaItem[] {
    return appointments
      .filter((a) => isSameDay(new Date(a.startsAt), day))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .map((a) => ({
        id: a.id,
        timeRange: `${format(new Date(a.startsAt), 'HH:mm')} – ${format(new Date(a.endsAt), 'HH:mm')}`,
        patientName: a.patientName,
        typeLabel: APPOINTMENT_TYPE_LABEL[a.type],
        modalityLabel: MODALITY_LABEL[a.modality],
        isCancelled: a.status === 'cancelled',
        notes: a.notes,
      }));
  }

  static dayTitle(day: Date): string {
    return format(day, 'EEEE d MMMM');
  }
}
