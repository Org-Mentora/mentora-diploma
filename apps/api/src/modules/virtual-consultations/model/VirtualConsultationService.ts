import {
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
  ValidationError,
} from '#core/errors/ApplicationError';
import type { Clock } from '#core/model/Clock';
import type { TransactionManager } from '#core/model/TransactionManager';
import {
  type AppointmentInfo,
  type AppointmentLookup,
  type MeetingInvitations,
  type MeetingLinkProvider,
  MeetingProviderError,
  type PatientContactInfo,
  type PatientContacts,
  type VirtualMeetingRepository,
} from './ports';
import { VirtualMeeting } from './VirtualMeeting';

export interface StartMeetingRequest {
  patientId: string;
  appointmentId: string | null;
}

const DEFAULT_MINUTES = 50;

export class VirtualConsultationService {
  constructor(
    private readonly meetings: VirtualMeetingRepository,
    private readonly links: MeetingLinkProvider,
    private readonly patients: PatientContacts,
    private readonly appointments: AppointmentLookup,
    private readonly invitations: MeetingInvitations,
    private readonly transactions: TransactionManager,
    private readonly clock: Clock,
  ) {}

  async start(professionalId: string, request: StartMeetingRequest): Promise<VirtualMeeting> {
    const patient = await this.patients.find(professionalId, request.patientId);
    if (!patient) {
      throw new NotFoundError('Patient', request.patientId);
    }
    const appointment = request.appointmentId
      ? await this.virtualAppointment(professionalId, request.appointmentId, request.patientId)
      : null;
    if (appointment) {
      const existing = await this.meetings.findByAppointment(professionalId, appointment.id);
      if (existing) {
        return existing;
      }
    }

    const now = this.clock.now();
    let joinUrl: string;
    try {
      joinUrl = await this.links.create({
        title: `Consultation with ${patient.fullName}`,
        startsAt: appointment && appointment.startsAt > now ? appointment.startsAt : now,
        durationMinutes: DEFAULT_MINUTES,
      });
    } catch (error) {
      if (error instanceof MeetingProviderError) {
        throw new ServiceUnavailableError(
          `The video call could not be created (${error.message}). Try again.`,
          'MEETING_PROVIDER_UNAVAILABLE',
        );
      }
      throw error;
    }

    const meeting = VirtualMeeting.start(
      {
        professionalId,
        patientId: request.patientId,
        appointmentId: appointment?.id ?? null,
        provider: this.links.provider,
        joinUrl,
      },
      now,
    );
    if (!(await this.meetings.insertIfFirstForAppointment(meeting))) {
      const existing = appointment
        ? await this.meetings.findByAppointment(professionalId, appointment.id)
        : null;
      if (existing) {
        return existing;
      }
      throw new ConflictError('The video call is already being started. Try again.');
    }

    const outcome = await this.invitations.send({
      professionalId,
      patientId: request.patientId,
      phone: patient.phone,
      email: patient.email,
      body: VirtualConsultationService.invitation(patient, joinUrl, appointment),
    });
    meeting.recordInvitation(outcome.status, outcome.error);
    await this.transactions.run(() => this.meetings.save(meeting));
    return meeting;
  }

  async history(professionalId: string, patientId: string): Promise<VirtualMeeting[]> {
    return this.meetings.findByPatient(professionalId, patientId);
  }

  async forAppointment(professionalId: string, appointmentId: string): Promise<VirtualMeeting[]> {
    const meeting = await this.meetings.findByAppointment(professionalId, appointmentId);
    return meeting ? [meeting] : [];
  }

  private async virtualAppointment(
    professionalId: string,
    appointmentId: string,
    patientId: string,
  ): Promise<AppointmentInfo> {
    const appointment = await this.appointments.find(professionalId, appointmentId);
    if (!appointment || appointment.patientId !== patientId) {
      throw new NotFoundError('Appointment', appointmentId);
    }
    if (appointment.status !== 'scheduled') {
      throw new ValidationError('The appointment was cancelled', { field: 'appointmentId' });
    }
    if (appointment.modality !== 'virtual') {
      throw new ValidationError('Only virtual appointments have a video call', {
        field: 'appointmentId',
      });
    }
    return appointment;
  }

  private static invitation(
    patient: PatientContactInfo,
    joinUrl: string,
    appointment: AppointmentInfo | null,
  ): string {
    const intro = appointment
      ? 'here is the link to join your virtual appointment'
      : 'your professional invited you to a virtual consultation';
    return `Hello ${patient.fullName}, ${intro}: ${joinUrl}`;
  }
}
