import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { useAgendaViewModel } from '../viewmodel/useAgendaViewModel';
import { AppointmentDialog } from './AppointmentDialog';
import { DayAgenda } from './DayAgenda';
import { MonthCalendar } from './MonthCalendar';

/** CU-10 Manage appointments and agenda. */
export function AgendaPage() {
  const vm = useAgendaViewModel();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="capitalize">{vm.monthTitle}</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Previous month"
              onClick={vm.previousMonth}
            >
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="sm" onClick={vm.goToToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon" aria-label="Next month" onClick={vm.nextMonth}>
              <ChevronRight />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <MonthCalendar
            title={vm.monthTitle}
            weekdays={vm.weekdays}
            weeks={vm.weeks}
            onSelectDay={vm.selectDay}
          />
          {vm.error && (
            <p role="alert" className="mt-3 text-destructive text-sm">
              {vm.error.message}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {vm.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading agenda…</p>
          ) : (
            <DayAgenda
              title={vm.dayTitle}
              items={vm.dayItems}
              onOpen={vm.openAppointment}
              onCreate={vm.openCreate}
            />
          )}
        </CardContent>
      </Card>

      {vm.dialog && (
        <AppointmentDialog
          key={vm.dialog.mode === 'edit' ? vm.dialog.appointmentId : 'new'}
          appointmentId={vm.dialog.mode === 'edit' ? vm.dialog.appointmentId : undefined}
          day={vm.dialog.day}
          onClose={vm.closeDialog}
        />
      )}
    </div>
  );
}
