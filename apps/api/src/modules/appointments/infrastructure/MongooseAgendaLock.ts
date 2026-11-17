import mongoose, { Schema } from 'mongoose';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { AgendaLock } from '../model/AgendaLock';

interface AgendaLockDocument {
  _id: string;
  version: number;
}

const AgendaLockModel = mongoose.model<AgendaLockDocument>(
  'AgendaLock',
  new Schema<AgendaLockDocument>(
    { _id: { type: String, required: true }, version: { type: Number, required: true } },
    { versionKey: false },
  ),
  'agenda_locks',
);

// Adapter
export class MongooseAgendaLock implements AgendaLock {
  constructor(private readonly context: TransactionContext) {}

  async acquire(professionalId: string): Promise<void> {
    await AgendaLockModel.updateOne(
      { _id: professionalId },
      { $inc: { version: 1 } },
      { upsert: true },
    ).session(this.context.session);
  }
}
