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
import { dateLocale, translate as t } from '@/shared/i18n';
import { Formats } from '../format/Formats';

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
  isOnline: boolean;
  feeLabel: string | null;
  notes: string | null;
}

export const APPOINTMENT_TYPES: AppointmentType[] = [
  'first_visit',
  'control',
  'follow_up',
  'medication',
  'other',
];

export const MODALITIES: AppointmentModality[] = ['in_person', 'virtual'];

export const typeLabel = (type: AppointmentType): string => t(`agenda.type.${type}`);
export const modalityLabel = (modality: AppointmentModality): string =>
  t(`agenda.modality.${modality}`);

const WEEK = { weekStartsOn: 1 } as const;

// Adapter
export class AgendaAdapter {
  static monthRange(month: Date): { from: Date; to: Date } {
    const from = startOfWeek(startOfMonth(month), WEEK);
    const to = addDays(endOfWeek(endOfMonth(month), WEEK), 1);
    return { from: new Date(from.setHours(0, 0, 0, 0)), to: new Date(to.setHours(0, 0, 0, 0)) };
  }

  static monthTitle(month: Date): string {
    return format(month, 'LLLL yyyy', { locale: dateLocale() });
  }

  static weekdayLabels(): string[] {
    const monday = startOfWeek(new Date(), WEEK);
    return Array.from({ length: 7 }, (_, i) =>
      format(addDays(monday, i), 'EEEEEE', { locale: dateLocale() }),
    );
  }

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

  static dayAgenda(appointments: AppointmentDto[], day: Date): AgendaItem[] {
    return appointments
      .filter((a) => isSameDay(new Date(a.startsAt), day))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .map((a) => ({
        id: a.id,
        timeRange: `${format(new Date(a.startsAt), 'HH:mm')} – ${format(new Date(a.endsAt), 'HH:mm')}`,
        patientName: a.patientName,
        typeLabel: typeLabel(a.type),
        modalityLabel: modalityLabel(a.modality),
        isCancelled: a.status === 'cancelled',
        isOnline: a.source === 'online',
        feeLabel: a.fee === null ? null : Formats.money(a.fee),
        notes: a.notes,
      }));
  }

  static dayTitle(day: Date): string {
    return format(day, t('agenda.dayTitleFormat'), { locale: dateLocale() });
  }
}
