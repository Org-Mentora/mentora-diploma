import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type {
  BookingSettingsDto,
  UpdateBookingSettingsRequestDto,
} from '../contracts/booking.contracts';
import type { BookingService } from '../model/BookingService';
import type { IsoWeekday } from '../model/LocalCalendar';
import { BookingViewModel } from './BookingViewModel';

export interface UpdateBookingSettingsInput {
  actor: AuthenticatedActor;
  data: UpdateBookingSettingsRequestDto;
}

// Presenter
export class UpdateBookingSettingsPresenter extends Presenter<
  UpdateBookingSettingsInput,
  BookingSettingsDto,
  BookingService
> {
  protected async execute({
    actor,
    data,
  }: UpdateBookingSettingsInput): Promise<BookingSettingsDto> {
    const page = await this.model.configure(actor.professionalId, {
      ...data,
      weeklyHours: data.weeklyHours.map((w) => ({ ...w, weekday: w.weekday as IsoWeekday })),
    });
    return BookingViewModel.settings(page, this.model.timezone);
  }
}
