import { Repository } from '#core/model/Repository';
import type { MeetingProvider, VirtualMeeting } from './VirtualMeeting';

// Repository
export abstract class VirtualMeetingRepository extends Repository<VirtualMeeting> {
  abstract findByPatient(professionalId: string, patientId: string): Promise<VirtualMeeting[]>;
  abstract findByAppointment(
    professionalId: string,
    appointmentId: string,
  ): Promise<VirtualMeeting | null>;
  abstract insertIfFirstForAppointment(meeting: VirtualMeeting): Promise<boolean>;
}

export interface MeetingRequest {
  title: string;
  startsAt: Date;
  durationMinutes: number;
}

export class MeetingProviderError extends Error {}

// Strategy
export abstract class MeetingLinkProvider {
  abstract readonly provider: MeetingProvider;
  abstract create(request: MeetingRequest): Promise<string>;
}

export interface PatientContactInfo {
  fullName: string;
  phone: string | null;
  email: string | null;
}

export abstract class PatientContacts {
  abstract find(professionalId: string, patientId: string): Promise<PatientContactInfo | null>;
}

export interface AppointmentInfo {
  id: string;
  patientId: string;
  startsAt: Date;
  modality: 'in_person' | 'virtual';
  status: 'scheduled' | 'cancelled';
}

export abstract class AppointmentLookup {
  abstract find(professionalId: string, appointmentId: string): Promise<AppointmentInfo | null>;
}

export interface Invitation {
  professionalId: string;
  patientId: string;
  phone: string | null;
  email: string | null;
  body: string;
}

export abstract class MeetingInvitations {
  abstract send(
    invitation: Invitation,
  ): Promise<{ status: 'sent' | 'failed' | 'skipped'; error: string | null }>;
}
