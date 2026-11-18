import type { Page, PageRequest } from '#core/model/Pagination';
import { Keyset } from '#infrastructure/database/Keyset';
import { MongooseRepository } from '#infrastructure/database/MongooseRepository';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { Appointment, AppointmentType } from '../model/Appointment';
import type { AppointmentRepository } from '../model/AppointmentRepository';
import type { EarningsRow } from '../model/EarningsReport';
import { AppointmentMapper } from './AppointmentMapper';
import { type AppointmentDocument, AppointmentModel } from './AppointmentSchema';

const BY_START = new Keyset([
  { path: 'startsAt', direction: 1, type: 'date' },
  { path: '_id', direction: 1 },
]);

// Repository, Adapter
export class MongooseAppointmentRepository
  extends MongooseRepository<Appointment, AppointmentDocument>
  implements AppointmentRepository
{
  constructor(
    context: TransactionContext,
    private readonly timezone: string = 'UTC',
  ) {
    super(AppointmentModel, new AppointmentMapper(), context);
  }

  async findOwned(professionalId: string, id: string): Promise<Appointment | null> {
    const record = await this.model
      .findOne({ _id: id, professionalId })
      .session(this.session)
      .lean<AppointmentDocument>();
    return record ? this.mapper.toDomain(record) : null;
  }

  async findStartingBetween(
    professionalId: string,
    from: Date,
    to: Date,
    page: PageRequest,
  ): Promise<Page<Appointment>> {
    const records = await this.model
      .find(BY_START.where({ professionalId, startsAt: { $gte: from, $lt: to } }, page.after))
      .sort(BY_START.sort())
      .limit(page.limit + 1)
      .session(this.session)
      .lean<AppointmentDocument[]>();
    return BY_START.page(records, page, (record) => this.mapper.toDomain(record));
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

  async earnings(professionalId: string, from: Date, to: Date, now: Date): Promise<EarningsRow[]> {
    const rows = await this.model
      .aggregate<{
        _id: { month: string; type: AppointmentType; held: boolean };
        total: number;
        count: number;
        unpriced: number;
      }>([
        { $match: { professionalId, status: 'scheduled', startsAt: { $gte: from, $lt: to } } },
        {
          $group: {
            _id: {
              month: {
                $dateToString: { date: '$startsAt', format: '%Y-%m', timezone: this.timezone },
              },
              type: '$type',
              held: { $lt: ['$startsAt', now] },
            },
            total: { $sum: { $ifNull: ['$fee', 0] } },
            count: { $sum: 1 },
            unpriced: { $sum: { $cond: [{ $eq: [{ $ifNull: ['$fee', null] }, null] }, 1, 0] } },
          },
        },
      ])
      .session(this.session);
    return rows.map((row) => ({
      month: row._id.month,
      type: row._id.type,
      held: row._id.held,
      total: row.total,
      count: row.count,
      unpriced: row.unpriced,
    }));
  }
}
