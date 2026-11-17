import { Presenter } from '#core/presenter/Presenter';
import type { AuthenticatedActor } from '#core/security/AuthenticatedActor';
import type { View } from '#core/view/View';
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
  }: RejectBookingRequestInput): Promise<BookingRequestDto> {
    const entry = await this.booking.reject(actor.professionalId, requestId, data.reason ?? null);
    return BookingViewModel.request(entry);
  }
}
