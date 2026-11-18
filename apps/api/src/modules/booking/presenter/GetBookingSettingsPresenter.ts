import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { BookingSettingsDto } from '../contracts/booking.contracts';
import type { BookingService } from '../model/BookingService';
import { BookingViewModel } from './BookingViewModel';

// Presenter
export class GetBookingSettingsPresenter extends Presenter<
  AuthenticatedActor,
  BookingSettingsDto,
  BookingService
> {
  protected async execute(actor: AuthenticatedActor): Promise<BookingSettingsDto> {
    const page = await this.model.settings(actor.professionalId);
    return BookingViewModel.settings(page, this.model.timezone);
  }
}
