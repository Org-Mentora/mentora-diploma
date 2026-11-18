import { CursorCodec, type PageInput } from '#core/presenter/CursorCodec';
import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
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
  BookingRequestPageDto,
  BookingService
> {
  protected async execute(input: ListBookingRequestsInput): Promise<BookingRequestPageDto> {
    const page = await this.model.list(
      input.actor.professionalId,
      input.status ?? null,
      CursorCodec.request(input),
    );
    return CursorCodec.toDto(page, BookingViewModel.request);
  }
}
