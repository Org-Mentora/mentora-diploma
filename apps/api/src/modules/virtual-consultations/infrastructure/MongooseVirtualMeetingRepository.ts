import mongoose, { Schema } from 'mongoose';
import type { DataMapper } from '#core/model/DataMapper';
import {
  type MongoDocument,
  MongooseRepository,
} from '#infrastructure/database/MongooseRepository';
import type { TransactionContext } from '#infrastructure/database/TransactionContext';
import type { VirtualMeetingRepository } from '../model/ports';
import {
  type InvitationStatus,
  type MeetingProvider,
  VirtualMeeting,
} from '../model/VirtualMeeting';

interface VirtualMeetingDocument extends MongoDocument {
  professionalId: string;
  patientId: string;
  appointmentId: string | null;
  provider: MeetingProvider;
  joinUrl: string;
  invitationStatus: InvitationStatus;
  invitationError: string | null;
  createdAt: Date;
}

const schema = new Schema<VirtualMeetingDocument>(
  {
    _id: { type: String, required: true },
    professionalId: { type: String, required: true },
    patientId: { type: String, required: true },
    appointmentId: { type: String, default: null },
    provider: { type: String, enum: ['jitsi', 'google_meet'], required: true },
    joinUrl: { type: String, required: true },
    invitationStatus: {
      type: String,
      enum: ['pending', 'sent', 'failed', 'skipped'],
      required: true,
    },
    invitationError: { type: String, default: null },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);
schema.index({ professionalId: 1, patientId: 1, createdAt: -1 });
schema.index({ professionalId: 1, appointmentId: 1 });
schema.index(
  { appointmentId: 1 },
  { unique: true, partialFilterExpression: { appointmentId: { $type: 'string' } } },
);

const DUPLICATE_KEY = 11000;

const VirtualMeetingModel = mongoose.model<VirtualMeetingDocument>(
  'VirtualMeeting',
  schema,
  'virtual_meetings',
);

// Data Mapper
class VirtualMeetingMapper implements DataMapper<VirtualMeeting, VirtualMeetingDocument> {
  toDomain(record: VirtualMeetingDocument): VirtualMeeting {
    return VirtualMeeting.restore(record._id, {
      professionalId: record.professionalId,
      patientId: record.patientId,
      appointmentId: record.appointmentId,
      provider: record.provider,
      joinUrl: record.joinUrl,
      invitationStatus: record.invitationStatus,
      invitationError: record.invitationError,
      createdAt: record.createdAt,
    });
  }

  toPersistence(meeting: VirtualMeeting): VirtualMeetingDocument {
    return {
      _id: meeting.id,
      professionalId: meeting.professionalId,
      patientId: meeting.patientId,
      appointmentId: meeting.appointmentId,
      provider: meeting.provider,
      joinUrl: meeting.joinUrl,
      invitationStatus: meeting.invitationStatus,
      invitationError: meeting.invitationError,
      createdAt: meeting.createdAt,
    };
  }
}

// Repository, Adapter
export class MongooseVirtualMeetingRepository
  extends MongooseRepository<VirtualMeeting, VirtualMeetingDocument>
  implements VirtualMeetingRepository
{
  constructor(context: TransactionContext) {
    super(VirtualMeetingModel, new VirtualMeetingMapper(), context);
  }

  async insertIfFirstForAppointment(meeting: VirtualMeeting): Promise<boolean> {
    try {
      await this.model.create([this.mapper.toPersistence(meeting)], {
        session: this.session ?? undefined,
      });
      return true;
    } catch (error) {
      if ((error as { code?: number }).code === DUPLICATE_KEY) {
        return false;
      }
      throw error;
    }
  }

  async findByPatient(professionalId: string, patientId: string): Promise<VirtualMeeting[]> {
    const records = await this.model
      .find({ professionalId, patientId })
      .sort({ createdAt: -1 })
      .session(this.session)
      .lean<VirtualMeetingDocument[]>();
    return records.map((record) => this.mapper.toDomain(record));
  }

  async findByAppointment(
    professionalId: string,
    appointmentId: string,
  ): Promise<VirtualMeeting | null> {
    const record = await this.model
      .findOne({ professionalId, appointmentId })
      .session(this.session)
      .lean<VirtualMeetingDocument>();
    return record ? this.mapper.toDomain(record) : null;
  }
}
