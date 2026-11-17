import { MongooseRepository } from '#infrastructure/database/MongooseRepository';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { Appointment } from '../model/Appointment';
import type { AppointmentRepository } from '../model/AppointmentRepository';
import { AppointmentMapper } from './AppointmentMapper';
import { type AppointmentDocument, AppointmentModel } from './AppointmentSchema';

// Repository, Adapter
export class MongooseAppointmentRepository
  extends MongooseRepository<Appointment, AppointmentDocument>
  implements AppointmentRepository
{
  constructor(context: TransactionContext) {
    super(AppointmentModel, new AppointmentMapper(), context);
  }

  async findOwned(professionalId: string, id: string): Promise<Appointment | null> {
    const record = await this.model
      .findOne({ _id: id, professionalId })
      .session(this.session)
      .lean<AppointmentDocument>();
    return record ? this.mapper.toDomain(record) : null;
  }

  async findStartingBetween(professionalId: string, from: Date, to: Date): Promise<Appointment[]> {
    const records = await this.model
      .find({ professionalId, startsAt: { $gte: from, $lt: to } })
      .sort({ startsAt: 1 })
      .session(this.session)
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
      .session(this.session)
      .lean<AppointmentDocument[]>();
    return records.map((record) => this.mapper.toDomain(record));
  }

  async findNeedingReminder(from: Date, to: Date, limit: number): Promise<Appointment[]> {
    const records = await this.model
      .find({ status: 'scheduled', reminderSentAt: null, startsAt: { $gt: from, $lte: to } })
      .sort({ startsAt: 1 })
      .limit(limit)
      .session(this.session)
      .lean<AppointmentDocument[]>();
    return records.map((record) => this.mapper.toDomain(record));
  }
}
