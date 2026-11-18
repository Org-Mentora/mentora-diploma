import { Presenter } from '#core/presenter/Presenter';

import type { PublicBookingPageDto } from '../contracts/booking.contracts';
import type { BookingService } from '../model/BookingService';
import { BookingViewModel } from './BookingViewModel';

// Presenter
export class GetPublicBookingPagePresenter extends Presenter<
  string,
  PublicBookingPageDto,
  BookingService
> {
  protected async execute(slug: string): Promise<PublicBookingPageDto> {
    return BookingViewModel.publicPage(await this.model.publicPage(slug), this.model.timezone);
  }
}
