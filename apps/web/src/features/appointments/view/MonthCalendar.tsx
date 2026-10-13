import { cn } from '@/shared/lib/utils';
import type { CalendarDay } from '../viewmodel/useAgendaViewModel';

interface MonthCalendarProps {
  title: string;
  weekdays: string[];
  weeks: CalendarDay[][];
  onSelectDay: (day: Date) => void;
}

/** CU-10 step 2: month grid; a dot marks days with scheduled appointments. */
export function MonthCalendar({ title, weekdays, weeks, onSelectDay }: MonthCalendarProps) {
  return (
    <table className="w-full table-fixed border-separate border-spacing-1">
      <caption className="sr-only">{title}</caption>
      <thead>
        <tr>
          {weekdays.map((weekday) => (
            <th
              key={weekday}
              scope="col"
              className="py-1 font-normal text-muted-foreground text-xs"
            >
              {weekday}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week) => (
          <tr key={week[0]?.key}>
            {week.map((day) => (
              <td key={day.key} className="p-0">
                <button
                  type="button"
                  aria-pressed={day.isSelected}
                  aria-label={`${day.key}${day.appointmentCount ? `, ${day.appointmentCount} appointments` : ''}`}
                  onClick={() => onSelectDay(day.date)}
                  className={cn(
                    'flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-md text-sm transition-colors hover:bg-accent',
                    !day.inMonth && 'text-muted-foreground/50',
                    day.isToday && 'font-semibold text-primary',
                    day.isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
                  )}
                >
                  {day.dayNumber}
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      day.appointmentCount > 0
                        ? day.isSelected
                          ? 'bg-primary-foreground'
                          : 'bg-emerald-600'
                        : 'bg-transparent',
                    )}
                  />
                </button>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
