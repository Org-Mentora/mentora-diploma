import { Presenter } from '#core/presenter/Presenter';

import type { AvailableSlotsDto, AvailableSlotsQueryDto } from '../contracts/booking.contracts';
import type { BookingService } from '../model/BookingService';

export interface GetAvailableSlotsInput extends AvailableSlotsQueryDto {
  slug: string;
}

// Presenter
export class GetAvailableSlotsPresenter extends Presenter<
  GetAvailableSlotsInput,
  AvailableSlotsDto,
  BookingService
> {
  protected async execute({
    slug,
    from,
    days,
  }: GetAvailableSlotsInput): Promise<AvailableSlotsDto> {
    const plan = await this.model.availability(slug, from, days);
    return {
      timezone: this.model.timezone,
      days: plan.map((day) => ({
        date: day.date,
        slots: day.slots.map((slot) => slot.toISOString()),
      })),
    };
  }
}
