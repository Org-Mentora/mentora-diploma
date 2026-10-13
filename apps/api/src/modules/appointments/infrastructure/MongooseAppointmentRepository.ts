import { MongooseRepository } from '#infrastructure/database/MongooseRepository';
import type { Appointment } from '../model/Appointment';
import type { AppointmentRepository } from '../model/AppointmentRepository';
import { AppointmentMapper } from './AppointmentMapper';
import { type AppointmentDocument, AppointmentModel } from './AppointmentSchema';

/** Adapter (ADR-0007): `AppointmentRepository` on MongoDB. */
export class MongooseAppointmentRepository
  extends MongooseRepository<Appointment, AppointmentDocument>
  implements AppointmentRepository
{
  constructor() {
    super(AppointmentModel, new AppointmentMapper());
  }

  async findOwned(professionalId: string, id: string): Promise<Appointment | null> {
    const record = await this.model
      .findOne({ _id: id, professionalId })
      .lean<AppointmentDocument>();
    return record ? this.mapper.toDomain(record) : null;
  }

  async findStartingBetween(professionalId: string, from: Date, to: Date): Promise<Appointment[]> {
    const records = await this.model
      .find({ professionalId, startsAt: { $gte: from, $lt: to } })
      .sort({ startsAt: 1 })
      .lean<AppointmentDocument[]>();
    return records.map((record) => this.mapper.toDomain(record));
  }

  async findScheduledOverlapping(
    professionalId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<Appointment[]> {
    const records = await this.model
      .find({
        professionalId,
        status: 'scheduled',
        startsAt: { $lt: endsAt },
        endsAt: { $gt: startsAt },
      })
      .lean<AppointmentDocument[]>();
    return records.map((record) => this.mapper.toDomain(record));
  }
}
