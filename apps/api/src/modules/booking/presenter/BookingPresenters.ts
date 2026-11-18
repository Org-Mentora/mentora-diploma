import type { View } from '#core/view/View';
import type {
  AvailableSlotsDto,
  BookingReceiptDto,
  BookingRequestDto,
  BookingRequestPageDto,
  BookingSettingsDto,
  PublicBookingPageDto,
} from '../contracts/booking.contracts';
import type { BookingService } from '../model/BookingService';
import { AcceptBookingRequestPresenter } from './AcceptBookingRequestPresenter';
import { CreateBookingRequestPresenter } from './CreateBookingRequestPresenter';
import { GetAvailableSlotsPresenter } from './GetAvailableSlotsPresenter';
import { GetBookingSettingsPresenter } from './GetBookingSettingsPresenter';
import { GetPublicBookingPagePresenter } from './GetPublicBookingPagePresenter';
import { ListBookingRequestsPresenter } from './ListBookingRequestsPresenter';
import { RejectBookingRequestPresenter } from './RejectBookingRequestPresenter';
import { UpdateBookingSettingsPresenter } from './UpdateBookingSettingsPresenter';

// Abstract Factory
export class BookingPresenters {
  constructor(private readonly bookingService: BookingService) {}

  getBookingSettings(view: View<BookingSettingsDto>) {
    return new GetBookingSettingsPresenter(view, this.bookingService);
  }

  updateBookingSettings(view: View<BookingSettingsDto>) {
    return new UpdateBookingSettingsPresenter(view, this.bookingService);
  }

  listBookingRequests(view: View<BookingRequestPageDto>) {
    return new ListBookingRequestsPresenter(view, this.bookingService);
  }

  acceptBookingRequest(view: View<BookingRequestDto>) {
    return new AcceptBookingRequestPresenter(view, this.bookingService);
  }

  rejectBookingRequest(view: View<BookingRequestDto>) {
    return new RejectBookingRequestPresenter(view, this.bookingService);
  }

  getPublicBookingPage(view: View<PublicBookingPageDto>) {
    return new GetPublicBookingPagePresenter(view, this.bookingService);
  }

  getAvailableSlots(view: View<AvailableSlotsDto>) {
    return new GetAvailableSlotsPresenter(view, this.bookingService);
  }

  createBookingRequest(view: View<BookingReceiptDto>) {
    return new CreateBookingRequestPresenter(view, this.bookingService);
  }
}
