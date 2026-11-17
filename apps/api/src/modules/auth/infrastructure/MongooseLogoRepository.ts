import mongoose, { Schema } from 'mongoose';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import { LogoRepository } from '../model/LogoRepository';
import { type LogoMimeType, ProfessionalLogo } from '../model/ProfessionalLogo';

interface LogoDocument {
  _id: string;
  mimeType: LogoMimeType;
  data: Buffer;
  updatedAt: Date;
}

const LogoModel = mongoose.model<LogoDocument>(
  'ProfessionalLogo',
  new Schema<LogoDocument>(
    {
      _id: { type: String, required: true },
      mimeType: { type: String, enum: ['image/png', 'image/jpeg'], required: true },
      data: { type: Buffer, required: true },
      updatedAt: { type: Date, required: true },
    },
    { versionKey: false },
  ),
  'professional_logos',
);

// Repository, Adapter
export class MongooseLogoRepository extends LogoRepository {
  constructor(private readonly context: TransactionContext) {
    super();
  }

  async find(professionalId: string): Promise<ProfessionalLogo | null> {
    const record = await LogoModel.findById(professionalId)
      .session(this.context.session)
      .lean<LogoDocument>();
    if (!record) {
      return null;
    }
    return ProfessionalLogo.restore(record.mimeType, MongooseLogoRepository.bytesOf(record.data));
  }

  private static bytesOf(data: unknown): string {
    const bytes = Buffer.isBuffer(data)
      ? data
      : Buffer.from((data as { buffer: Uint8Array }).buffer);
    return bytes.toString('base64');
  }

  async save(professionalId: string, logo: ProfessionalLogo, at: Date): Promise<void> {
    await LogoModel.replaceOne(
      { _id: professionalId },
      {
        _id: professionalId,
        mimeType: logo.mimeType,
        data: Buffer.from(logo.base64, 'base64'),
        updatedAt: at,
      },
      { upsert: true, session: this.context.session ?? undefined },
    ).exec();
  }

  async delete(professionalId: string): Promise<void> {
    await LogoModel.deleteOne(
      { _id: professionalId },
      { session: this.context.session ?? undefined },
    ).exec();
  }
}
