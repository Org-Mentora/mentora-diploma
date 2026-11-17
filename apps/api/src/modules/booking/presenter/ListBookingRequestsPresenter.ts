import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type { BookingRequestDto, BookingRequestStatusDto } from '../contracts/booking.contracts';
import type { BookingService } from '../model/BookingService';
import { BookingViewModel } from './BookingViewModel';

export interface ListBookingRequestsInput {
  actor: AuthenticatedActor;
  status?: BookingRequestStatusDto;
}

// Presenter
export class ListBookingRequestsPresenter extends Presenter<
  ListBookingRequestsInput,
  BookingRequestDto[]
> {
  constructor(
    view: View<BookingRequestDto[]>,
    private readonly booking: BookingService,
  ) {
    super(view);
  }

  protected async execute({
    actor,
    status,
  }: ListBookingRequestsInput): Promise<BookingRequestDto[]> {
    const entries = await this.booking.list(actor.professionalId, status ?? null);
    return entries.map(BookingViewModel.request);
  }
}
