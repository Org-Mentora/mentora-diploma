import { Copy, ExternalLink, Video } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import { Button, buttonVariants } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { useVirtualMeetingViewModel } from '../viewmodel/useVirtualMeetingViewModel';

interface VirtualMeetingButtonProps {
  patientId: string;
  appointmentId?: string | undefined;
}

export function VirtualMeetingButton({ patientId, appointmentId }: VirtualMeetingButtonProps) {
  const { t } = useTranslation();
  const vm = useVirtualMeetingViewModel({ patientId, appointmentId });

  return (
    <>
      {vm.existing ? (
        <a
          href={vm.existing.joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: 'outline' })}
        >
          <Video /> {t('meetings.join')}
        </a>
      ) : (
        <Button variant="outline" onClick={() => void vm.start()} disabled={vm.isStarting}>
          <Video /> {vm.isStarting ? t('meetings.creating') : t('meetings.start')}
        </Button>
      )}

      <Dialog open={vm.started !== null} onOpenChange={(open) => !open && vm.close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('meetings.ready')}</DialogTitle>
            <DialogDescription>{vm.started?.invitationLabel}</DialogDescription>
          </DialogHeader>
          {vm.started && (
            <div className="flex gap-2">
              <Input readOnly value={vm.started.joinUrl} aria-label={t('meetings.link')} />
              <Button
                variant="outline"
                size="icon"
                aria-label={t('meetings.copyLink')}
                onClick={() => vm.started && void vm.copyLink(vm.started.joinUrl)}
              >
                <Copy />
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={vm.close}>
              {t('common.close')}
            </Button>
            {vm.started && (
              <a
                href={vm.started.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants()}
                onClick={vm.close}
              >
                <ExternalLink /> {t('meetings.openCall')}
              </a>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
