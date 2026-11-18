import { addMonths, isSameMonth, startOfDay, startOfMonth } from 'date-fns';
import { useMemo, useState } from 'react';
import { ApiErrorAdapter, type UiError } from '@/model/api/ApiErrorAdapter';
import { useListAppointmentsQuery } from '@/model/api/generated/mentoraApi';
import { usePagedQuery } from '@/model/api/usePagedQuery';
import {
  AgendaAdapter,
  type AgendaItem,
  type CalendarDay,
} from '@/model/domain/appointments/AgendaAdapter';

export type { AgendaItem, CalendarDay };

export type AppointmentDialogState =
  | { mode: 'create'; day: Date }
  | { mode: 'edit'; appointmentId: string; day: Date }
  | null;

export interface AgendaViewModel {
  monthTitle: string;
  weekdays: string[];
  weeks: CalendarDay[][];
  dayTitle: string;
  dayItems: AgendaItem[];
  isLoading: boolean;
  error: UiError | null;
  previousMonth: () => void;
  nextMonth: () => void;
  goToToday: () => void;
  selectDay: (day: Date) => void;
  dialog: AppointmentDialogState;
  openCreate: () => void;
  openAppointment: (appointmentId: string) => void;
  closeDialog: () => void;
}

const MONTH_PAGE_SIZE = 100;

// ViewModel
export function useAgendaViewModel(today: Date = new Date()): AgendaViewModel {
  const [month, setMonth] = useState(() => startOfMonth(today));
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(today));
  const [dialog, setDialog] = useState<AppointmentDialogState>(null);

  const range = useMemo(() => AgendaAdapter.monthRange(month), [month]);
  const list = usePagedQuery(
    useListAppointmentsQuery,
    { from: range.from.toISOString(), to: range.to.toISOString(), limit: MONTH_PAGE_SIZE },
    { loadAll: true },
  );
  const appointments = list.items;

  return {
    monthTitle: AgendaAdapter.monthTitle(month),
    weekdays: AgendaAdapter.weekdayLabels(),
    weeks: AgendaAdapter.calendar(month, appointments, selectedDay, today),
    dayTitle: AgendaAdapter.dayTitle(selectedDay),
    dayItems: AgendaAdapter.dayAgenda(appointments, selectedDay),
    isLoading: list.isLoading,
    error: ApiErrorAdapter.toUiError(list.error),
    previousMonth: () => setMonth((current) => addMonths(current, -1)),
    nextMonth: () => setMonth((current) => addMonths(current, 1)),
    goToToday: () => {
      setMonth(startOfMonth(today));
      setSelectedDay(startOfDay(today));
    },
    selectDay: (day) => {
      setSelectedDay(startOfDay(day));
      if (!isSameMonth(day, month)) {
        setMonth(startOfMonth(day));
      }
    },
    dialog,
    openCreate: () => setDialog({ mode: 'create', day: selectedDay }),
    openAppointment: (appointmentId) =>
      setDialog({ mode: 'edit', appointmentId, day: selectedDay }),
    closeDialog: () => setDialog(null),
  };
}
