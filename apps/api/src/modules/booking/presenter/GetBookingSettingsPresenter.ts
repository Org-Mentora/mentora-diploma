import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { BookingSettingsDto } from '../contracts/booking.contracts';
import type { BookingService } from '../model/BookingService';
import { BookingViewModel } from './BookingViewModel';

// Presenter
export class GetBookingSettingsPresenter extends Presenter<AuthenticatedActor, BookingSettingsDto> {
  constructor(
    view: View<BookingSettingsDto>,
    private readonly booking: BookingService,
  ) {
    super(view);
  }

  protected async execute(actor: AuthenticatedActor): Promise<BookingSettingsDto> {
    const page = await this.booking.settings(actor.professionalId);
    return BookingViewModel.settings(page, this.booking.timezone);
  }
}
