import { MessageCircle } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';
import { useNotificationsViewModel } from '../viewmodel/useNotificationsViewModel';

export function NotificationsPanel({ patientId }: { patientId: string }) {
  const { items, isLoading } = useNotificationsViewModel(patientId);

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading messages…</p>;
  }
  if (items.length === 0) {
    return (
      <EmptyState
        title="No messages yet"
        description="Appointment confirmations, changes, reminders and video call links are sent by WhatsApp."
      />
    );
  }

  return (
    <Card>
      <CardContent className="grid gap-3">
        {items.map((item) => (
          <div key={item.id} className="grid gap-1 border-b pb-3 last:border-b-0 last:pb-0">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <MessageCircle className="size-4 text-muted-foreground" />
              <span className="font-medium">{item.topicLabel}</span>
              <Badge variant={item.statusTone}>{item.statusLabel}</Badge>
              <span className="ml-auto text-muted-foreground text-xs">
                {item.when} · {item.recipient}
              </span>
            </div>
            <p className="text-muted-foreground text-sm">{item.body}</p>
            {item.detail && <p className="text-destructive text-xs">{item.detail}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
