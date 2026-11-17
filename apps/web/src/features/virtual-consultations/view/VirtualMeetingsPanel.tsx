import { ExternalLink, Video } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';
import { useVirtualMeetingHistoryViewModel } from '../viewmodel/useVirtualMeetingHistoryViewModel';

export function VirtualMeetingsPanel({ patientId }: { patientId: string }) {
  const { items, isLoading } = useVirtualMeetingHistoryViewModel(patientId);

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading meetings…</p>;
  }
  if (items.length === 0) {
    return (
      <EmptyState
        title="No virtual consultations yet"
        description="Start one from the patient header or from a virtual appointment."
      />
    );
  }

  return (
    <Card>
      <CardContent className="grid gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center gap-3 text-sm">
            <Video className="size-4 text-muted-foreground" />
            <span className="font-medium">{item.when}</span>
            <span className="text-muted-foreground">
              {item.providerLabel} · {item.origin}
            </span>
            <span className="text-muted-foreground text-xs">{item.invitationLabel}</span>
            <a
              href={item.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 underline"
            >
              Open <ExternalLink className="size-3" />
            </a>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
