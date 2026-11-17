import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
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
  BookingSettingsDto
> {
  constructor(
    view: View<BookingSettingsDto>,
    private readonly booking: BookingService,
  ) {
    super(view);
  }

  protected async execute({
    actor,
    data,
  }: UpdateBookingSettingsInput): Promise<BookingSettingsDto> {
    const page = await this.booking.configure(actor.professionalId, {
      ...data,
      weeklyHours: data.weeklyHours.map((w) => ({ ...w, weekday: w.weekday as IsoWeekday })),
    });
    return BookingViewModel.settings(page, this.booking.timezone);
  }
}
