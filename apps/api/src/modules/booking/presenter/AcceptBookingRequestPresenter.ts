import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
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
  BookingRequestDto,
  BookingService
> {
  protected async execute({
    actor,
    requestId,
    data,
  }: AcceptBookingRequestInput): Promise<BookingRequestDto> {
    const entry = await this.model.accept(actor.professionalId, requestId, {
      type: data.type,
      notes: data.notes ?? null,
    });
    return BookingViewModel.request(entry);
  }
}
