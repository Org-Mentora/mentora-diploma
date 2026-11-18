import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { BookingRequestDto, RejectBookingRequestDto } from '../contracts/booking.contracts';
import type { BookingService } from '../model/BookingService';
import { BookingViewModel } from './BookingViewModel';

export interface RejectBookingRequestInput {
  actor: AuthenticatedActor;
  requestId: string;
  data: RejectBookingRequestDto;
}

// Presenter
export class RejectBookingRequestPresenter extends Presenter<
  RejectBookingRequestInput,
  BookingRequestDto,
  BookingService
> {
  protected async execute({
    actor,
    requestId,
    data,
  }: RejectBookingRequestInput): Promise<BookingRequestDto> {
    const entry = await this.model.reject(actor.professionalId, requestId, data.reason ?? null);
    return BookingViewModel.request(entry);
  }
}
