import { randomUUID } from 'node:crypto';
import mongoose, { Schema } from 'mongoose';
import type { Page, PageRequest } from '#core/model/Pagination';
import { Keyset } from '#infrastructure/database/Keyset';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { RecordAccess, RecordAccessAction, RecordAccessLog } from '../model/RecordAccessLog';

const NEWEST_FIRST = Keyset.newestFirst('at');

interface RecordAccessDocument {
  _id: string;
  professionalId: string;
  patientId: string;
  action: RecordAccessAction;
  consultationId: string | null;
  at: Date;
}

const schema = new Schema<RecordAccessDocument>(
  {
    _id: { type: String, required: true },
    professionalId: { type: String, required: true },
    patientId: { type: String, required: true },
    action: {
      type: String,
      enum: ['view_record', 'view_consultation', 'view_diagnoses', 'register_consultation'],
      required: true,
    },
    consultationId: { type: String, default: null },
    at: { type: Date, required: true },
  },
  { versionKey: false },
);
schema.index({ professionalId: 1, patientId: 1, at: -1 });

const RecordAccessModel = mongoose.model<RecordAccessDocument>(
  'RecordAccess',
  schema,
  'clinical_record_access',
);

// Adapter
export class MongooseRecordAccessLog implements RecordAccessLog {
  constructor(private readonly context: TransactionContext) {}

  async append(access: RecordAccess): Promise<void> {
    await RecordAccessModel.create([{ _id: randomUUID(), ...access }], {
      session: this.context.session,
    });
  }

  async findByPatient(
    professionalId: string,
    patientId: string,
    page: PageRequest,
  ): Promise<Page<RecordAccess>> {
    const records = await RecordAccessModel.find(
      NEWEST_FIRST.where({ professionalId, patientId }, page.after),
    )
      .sort(NEWEST_FIRST.sort())
      .limit(page.limit + 1)
      .session(this.context.session)
      .lean<RecordAccessDocument[]>();
    return NEWEST_FIRST.page(
      records,
      page,
      ({ professionalId, patientId, action, consultationId, at }) => ({
        professionalId,
        patientId,
        action,
        consultationId,
        at,
      }),
    );
  }
}
