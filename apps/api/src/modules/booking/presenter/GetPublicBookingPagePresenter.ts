import { Presenter } from '#core/presenter/Presenter';

import type { View } from '#core/view/View';
import type { PublicBookingPageDto } from '../contracts/booking.contracts';
import type { BookingService } from '../model/BookingService';
import { BookingViewModel } from './BookingViewModel';

// Presenter
export class GetPublicBookingPagePresenter extends Presenter<string, PublicBookingPageDto> {
  constructor(
    view: View<PublicBookingPageDto>,
    private readonly booking: BookingService,
  ) {
    super(view);
  }

  protected async execute(slug: string): Promise<PublicBookingPageDto> {
    return BookingViewModel.publicPage(await this.booking.publicPage(slug), this.booking.timezone);
  }
}
