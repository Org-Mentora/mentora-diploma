import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { AcceptBookingRequestDto, BookingRequestDto } from '../contracts/booking.contracts';
import type { BookingService } from '../model/BookingService';
import { BookingViewModel } from './BookingViewModel';

export interface AcceptBookingRequestInput {
  actor: AuthenticatedActor;
  requestId: string;
  data: AcceptBookingRequestDto;
}

// Presenter
export class AcceptBookingRequestPresenter extends Presenter<
  AcceptBookingRequestInput,
  BookingRequestDto
> {
  constructor(
    view: View<BookingRequestDto>,
    private readonly booking: BookingService,
  ) {
    super(view);
  }

  protected async execute({
    actor,
    requestId,
    data,
  }: AcceptBookingRequestInput): Promise<BookingRequestDto> {
    const entry = await this.booking.accept(actor.professionalId, requestId, {
      type: data.type,
      notes: data.notes ?? null,
    });
    return BookingViewModel.request(entry);
  }
}
