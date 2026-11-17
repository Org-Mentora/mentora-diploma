import { toast } from 'sonner';
import type { UserFeedback } from './UserFeedback';

// Adapter
export class SonnerUserFeedback implements UserFeedback {
  success(message: string): void {
    toast.success(message);
  }

  error(message: string): void {
    toast.error(message);
  }

  warning(message: string): void {
    toast.warning(message);
  }
}
