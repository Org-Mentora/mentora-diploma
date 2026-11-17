import { Plus } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
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

export function DayAgenda({ title, items, onOpen, onCreate }: DayAgendaProps) {
  const { t } = useTranslation();
  return (
    <div className="grid content-start gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold first-letter:uppercase">{title}</h2>
        <Button size="sm" onClick={onCreate}>
          <Plus /> {t('agenda.new')}
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title={t('agenda.emptyTitle')} description={t('agenda.emptyDescription')} />
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
                  {item.isOnline && <Badge variant="success">{t('agenda.online')}</Badge>}
                  {item.feeLabel && <Badge variant="outline">{item.feeLabel}</Badge>}
                  {item.isCancelled && <Badge variant="danger">{t('agenda.cancelled')}</Badge>}
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
