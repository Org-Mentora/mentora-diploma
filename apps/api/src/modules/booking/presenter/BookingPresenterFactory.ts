import type { View } from '#core/view/View';
import type {
  AvailableSlotsDto,
  BookingReceiptDto,
  BookingRequestDto,
  BookingSettingsDto,
  PublicBookingPageDto,
} from '../contracts/booking.contracts';
import type { AcceptBookingRequestPresenter } from './AcceptBookingRequestPresenter';
import type { CreateBookingRequestPresenter } from './CreateBookingRequestPresenter';
import type { GetAvailableSlotsPresenter } from './GetAvailableSlotsPresenter';
import type { GetBookingSettingsPresenter } from './GetBookingSettingsPresenter';
import type { GetPublicBookingPagePresenter } from './GetPublicBookingPagePresenter';
import type { ListBookingRequestsPresenter } from './ListBookingRequestsPresenter';
import type { RejectBookingRequestPresenter } from './RejectBookingRequestPresenter';
import type { UpdateBookingSettingsPresenter } from './UpdateBookingSettingsPresenter';

// Abstract Factory
export interface BookingPresenterFactory {
  getBookingSettings(view: View<BookingSettingsDto>): GetBookingSettingsPresenter;
  updateBookingSettings(view: View<BookingSettingsDto>): UpdateBookingSettingsPresenter;
  listBookingRequests(view: View<BookingRequestDto[]>): ListBookingRequestsPresenter;
  acceptBookingRequest(view: View<BookingRequestDto>): AcceptBookingRequestPresenter;
  rejectBookingRequest(view: View<BookingRequestDto>): RejectBookingRequestPresenter;
  getPublicBookingPage(view: View<PublicBookingPageDto>): GetPublicBookingPagePresenter;
  getAvailableSlots(view: View<AvailableSlotsDto>): GetAvailableSlotsPresenter;
  createBookingRequest(view: View<BookingReceiptDto>): CreateBookingRequestPresenter;
}
