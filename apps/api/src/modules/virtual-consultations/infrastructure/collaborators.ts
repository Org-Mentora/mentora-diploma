import type { AppointmentDirectory } from '#modules/appointments';
import type { NotificationCenter } from '#modules/notifications';
import type { PatientDirectory } from '#modules/patients';
import {
  type AppointmentInfo,
  AppointmentLookup,
  type Invitation,
  MeetingInvitations,
  type PatientContactInfo,
  PatientContacts,
} from '../model/ports';

// Adapter
export class PatientDirectoryContacts extends PatientContacts {
  constructor(private readonly directory: PatientDirectory) {
    super();
  }

  async find(professionalId: string, patientId: string): Promise<PatientContactInfo | null> {
    const contacts = await this.directory.contacts(professionalId, [patientId]);
    return contacts.get(patientId) ?? null;
  }
}

// Adapter
export class AppointmentDirectoryLookup extends AppointmentLookup {
  constructor(private readonly directory: AppointmentDirectory) {
    super();
  }

  find(professionalId: string, appointmentId: string): Promise<AppointmentInfo | null> {
    return this.directory.findOwned(professionalId, appointmentId);
  }
}

// Adapter
export class NotificationMeetingInvitations extends MeetingInvitations {
  constructor(private readonly notifications: NotificationCenter) {
    super();
  }

  send(invitation: Invitation) {
    return this.notifications.send({
      professionalId: invitation.professionalId,
      patientId: invitation.patientId,
      phone: invitation.phone,
      email: invitation.email,
      topic: 'virtual_meeting',
      body: invitation.body,
    });
  }
}
