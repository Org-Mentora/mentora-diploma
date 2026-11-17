import { Entity } from '#core/model/Entity';

export type MeetingProvider = 'jitsi' | 'google_meet';
export type InvitationStatus = 'pending' | 'sent' | 'failed' | 'skipped';

export interface VirtualMeetingProps {
  professionalId: string;
  patientId: string;
  appointmentId: string | null;
  provider: MeetingProvider;
  joinUrl: string;
  invitationStatus: InvitationStatus;
  invitationError: string | null;
  createdAt: Date;
}

// Aggregate Root
export class VirtualMeeting extends Entity<VirtualMeetingProps> {
  static start(
    data: Pick<
      VirtualMeetingProps,
      'professionalId' | 'patientId' | 'appointmentId' | 'provider' | 'joinUrl'
    >,
    now: Date,
  ): VirtualMeeting {
    return new VirtualMeeting(crypto.randomUUID(), {
      ...data,
      invitationStatus: 'pending',
      invitationError: null,
      createdAt: now,
    });
  }

  static restore(id: string, props: VirtualMeetingProps): VirtualMeeting {
    return new VirtualMeeting(id, props);
  }

  recordInvitation(status: Exclude<InvitationStatus, 'pending'>, error: string | null): void {
    this.props = { ...this.props, invitationStatus: status, invitationError: error };
  }

  get professionalId(): string {
    return this.props.professionalId;
  }

  get patientId(): string {
    return this.props.patientId;
  }

  get appointmentId(): string | null {
    return this.props.appointmentId;
  }

  get provider(): MeetingProvider {
    return this.props.provider;
  }

  get joinUrl(): string {
    return this.props.joinUrl;
  }

  get invitationStatus(): InvitationStatus {
    return this.props.invitationStatus;
  }

  get invitationError(): string | null {
    return this.props.invitationError;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
