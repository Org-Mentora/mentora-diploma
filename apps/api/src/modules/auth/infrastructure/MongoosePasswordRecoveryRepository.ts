import mongoose, { Schema } from 'mongoose';
import type { DataMapper } from '#core/model/DataMapper';
import {
  type MongoDocument,
  MongooseRepository,
} from '#infrastructure/database/MongooseRepository';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import { PasswordRecovery } from '../model/PasswordRecovery';
import type { PasswordRecoveryRepository } from '../model/PasswordRecoveryRepository';

interface PasswordRecoveryDocument extends MongoDocument {
  professionalId: string;
  codeHash: string;
  expiresAt: Date;
  failedAttempts: number;
  usedAt: Date | null;
  createdAt: Date;
}

const schema = new Schema<PasswordRecoveryDocument>(
  {
    _id: { type: String, required: true },
    professionalId: { type: String, required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    failedAttempts: { type: Number, required: true },
    usedAt: { type: Date, default: null },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);
schema.index({ professionalId: 1, createdAt: -1 });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

const PasswordRecoveryModel = mongoose.model<PasswordRecoveryDocument>(
  'PasswordRecovery',
  schema,
  'password_recoveries',
);

// Data Mapper
class PasswordRecoveryMapper implements DataMapper<PasswordRecovery, PasswordRecoveryDocument> {
  toDomain(record: PasswordRecoveryDocument): PasswordRecovery {
    return PasswordRecovery.restore(record._id, {
      professionalId: record.professionalId,
      codeHash: record.codeHash,
      expiresAt: record.expiresAt,
      failedAttempts: record.failedAttempts,
      usedAt: record.usedAt,
      createdAt: record.createdAt,
    });
  }

  toPersistence(recovery: PasswordRecovery): PasswordRecoveryDocument {
    return {
      _id: recovery.id,
      professionalId: recovery.professionalId,
      codeHash: recovery.codeHash,
      expiresAt: recovery.expiresAt,
      failedAttempts: recovery.failedAttempts,
      usedAt: recovery.usedAt,
      createdAt: recovery.createdAt,
    };
  }
}

// Repository, Adapter
export class MongoosePasswordRecoveryRepository
  extends MongooseRepository<PasswordRecovery, PasswordRecoveryDocument>
  implements PasswordRecoveryRepository
{
  constructor(context: TransactionContext) {
    super(PasswordRecoveryModel, new PasswordRecoveryMapper(), context);
  }

  async findLatestUnused(professionalId: string): Promise<PasswordRecovery | null> {
    const record = await this.model
      .findOne({ professionalId, usedAt: null })
      .sort({ createdAt: -1 })
      .session(this.session)
      .lean<PasswordRecoveryDocument>();
    return record ? this.mapper.toDomain(record) : null;
  }
}
