import { Repository } from '#core/model/Repository';
import type { Notification } from './Notification';

// Repository
export abstract class NotificationRepository extends Repository<Notification> {
  abstract findByPatient(professionalId: string, patientId: string): Promise<Notification[]>;
}
