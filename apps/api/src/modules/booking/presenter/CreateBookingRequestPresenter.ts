import { Presenter } from '#core/presenter/Presenter';

import type { View } from '#core/view/View';
import type { BookingReceiptDto, CreateBookingRequestDto } from '../contracts/booking.contracts';
import type { BookingService } from '../model/BookingService';

export interface CreateBookingRequestInput {
  slug: string;
  data: CreateBookingRequestDto;
}

// Presenter
export class CreateBookingRequestPresenter extends Presenter<
  CreateBookingRequestInput,
  BookingReceiptDto
> {
  constructor(
    view: View<BookingReceiptDto>,
    private readonly booking: BookingService,
  ) {
    super(view);
  }

  protected async execute({ slug, data }: CreateBookingRequestInput): Promise<BookingReceiptDto> {
    const request = await this.booking.request(slug, {
      requester: {
        firstName: data.firstName,
        lastName: data.lastName,
        dni: data.dni,
        birthDate: data.birthDate ? new Date(`${data.birthDate}T00:00:00.000Z`) : null,
        phone: data.phone ?? null,
        email: data.email ?? null,
      },
      startsAt: new Date(data.startsAt),
      modality: data.modality,
      reason: data.reason ?? null,
    });
    return {
      id: request.id,
      startsAt: request.startsAt.toISOString(),
      durationMinutes: request.durationMinutes,
      modality: request.modality,
      status: 'pending',
    };
  }
}
