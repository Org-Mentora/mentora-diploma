import { CursorCodec, type PageInput } from '#core/presenter/CursorCodec';
import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
import type {
  BookingRequestPageDto,
  BookingRequestStatusDto,
} from '../contracts/booking.contracts';
import type { BookingService } from '../model/BookingService';
import { BookingViewModel } from './BookingViewModel';

export interface ListBookingRequestsInput extends PageInput {
  actor: AuthenticatedActor;
  status?: BookingRequestStatusDto | undefined;
}

// Presenter
export class ListBookingRequestsPresenter extends Presenter<
  ListBookingRequestsInput,
  BookingRequestPageDto
> {
  constructor(
    view: View<BookingRequestPageDto>,
    private readonly booking: BookingService,
  ) {
    super(view);
  }

  protected async execute(input: ListBookingRequestsInput): Promise<BookingRequestPageDto> {
    const page = await this.booking.list(
      input.actor.professionalId,
      input.status ?? null,
      CursorCodec.request(input),
    );
    return CursorCodec.toDto(page, BookingViewModel.request);
  }
}
