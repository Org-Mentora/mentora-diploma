import type { BookingRequest } from './BookingRequest';

export abstract class BookingNotifier {
  abstract rejected(request: BookingRequest, professionalName: string): Promise<void>;
}
