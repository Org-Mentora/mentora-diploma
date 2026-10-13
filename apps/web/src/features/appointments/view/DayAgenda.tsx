import { Plus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import type { AgendaItem } from '../viewmodel/useAgendaViewModel';

interface DayAgendaProps {
  title: string;
  items: AgendaItem[];
  onOpen: (appointmentId: string) => void;
  onCreate: () => void;
}

/** CU-10 step 5: the selected day's appointments in chronological order. */
export function DayAgenda({ title, items, onOpen, onCreate }: DayAgendaProps) {
  return (
    <div className="grid content-start gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold capitalize">{title}</h2>
        <Button size="sm" onClick={onCreate}>
          <Plus /> New appointment
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState
          title="No appointments this day"
          description="Schedule one with the button above."
        />
      ) : (
        <ul className="grid gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onOpen(item.id)}
                className={cn(
                  'grid w-full gap-1 rounded-md border bg-background p-3 text-left transition-colors hover:bg-accent/50',
                  item.isCancelled && 'opacity-60',
                )}
              >
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium tabular-nums">{item.timeRange}</span>
                  <span className={cn(item.isCancelled && 'line-through')}>{item.patientName}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{item.typeLabel}</Badge>
                  <Badge variant="secondary">{item.modalityLabel}</Badge>
                  {item.isCancelled && <Badge variant="danger">Cancelled</Badge>}
                </div>
                {item.notes && <p className="text-muted-foreground text-xs">{item.notes}</p>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
