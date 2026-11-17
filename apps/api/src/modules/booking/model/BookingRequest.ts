import { ConflictError, ValidationError } from '#core/errors/ApplicationError';
import { Entity } from '#core/model/Entity';
import type { BookingModality } from './BookingPage';

export type BookingRequestStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface Requester {
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: Date | null;
  phone: string | null;
  email: string | null;
}

export interface BookingRequestProps {
  professionalId: string;
  requester: Requester;
  startsAt: Date;
  durationMinutes: number;
  modality: BookingModality;
  reason: string | null;
  status: BookingRequestStatus;
  patientId: string | null;
  appointmentId: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  decidedAt: Date | null;
}

const DNI = /^\d{7,8}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TEXT = 500;

// Aggregate Root
export class BookingRequest extends Entity<BookingRequestProps> {
  static submit(
    id: string,
    professionalId: string,
    data: {
      requester: Requester;
      startsAt: Date;
      durationMinutes: number;
      modality: BookingModality;
      reason: string | null;
    },
    now: Date,
  ): BookingRequest {
    return new BookingRequest(id, {
      professionalId,
      requester: BookingRequest.validRequester(data.requester),
      startsAt: data.startsAt,
      durationMinutes: data.durationMinutes,
      modality: data.modality,
      reason: BookingRequest.text(data.reason, 'reason'),
      status: 'pending',
      patientId: null,
      appointmentId: null,
      rejectionReason: null,
      createdAt: now,
      decidedAt: null,
    });
  }

  static restore(id: string, props: BookingRequestProps): BookingRequest {
    return new BookingRequest(id, props);
  }

  static normalizeDni(dni: string): string {
    return dni.replace(/[.\s-]/g, '');
  }

  private static validRequester(requester: Requester): Requester {
    const firstName = requester.firstName.trim();
    const lastName = requester.lastName.trim();
    if (!firstName || !lastName) {
      throw new ValidationError('First and last name are required', { field: 'firstName' });
    }
    const dni = BookingRequest.normalizeDni(requester.dni);
    if (!DNI.test(dni)) {
      throw new ValidationError('DNI must have 7 or 8 digits', { field: 'dni' });
    }
    const phone = requester.phone?.trim() || null;
    const email = requester.email?.trim().toLowerCase() || null;
    if (!phone && !email) {
      throw new ValidationError('Leave a phone number or an email to confirm the appointment', {
        field: 'phone',
      });
    }
    if (email && !EMAIL.test(email)) {
      throw new ValidationError('The email is not valid', { field: 'email' });
    }
    return { ...requester, firstName, lastName, dni, phone, email };
  }

  private static text(value: string | null, field: string): string | null {
    const text = value?.trim() || null;
    if (text && text.length > MAX_TEXT) {
      throw new ValidationError(`Use up to ${MAX_TEXT} characters`, { field });
    }
    return text;
  }

  accept(patientId: string, appointmentId: string, now: Date): void {
    this.assertPending();
    this.props = { ...this.props, status: 'accepted', patientId, appointmentId, decidedAt: now };
  }

  reject(reason: string | null, now: Date): void {
    this.assertPending();
    this.props = {
      ...this.props,
      status: 'rejected',
      rejectionReason: BookingRequest.text(reason, 'reason'),
      decidedAt: now,
    };
  }

  expireIfPast(now: Date): boolean {
    if (this.props.status !== 'pending' || this.props.startsAt.getTime() > now.getTime()) {
      return false;
    }
    this.props = { ...this.props, status: 'expired', decidedAt: now };
    return true;
  }

  private assertPending(): void {
    if (this.props.status !== 'pending') {
      throw new ConflictError(`This request was already ${this.props.status}`, {
        status: this.props.status,
      });
    }
  }

  get professionalId(): string {
    return this.props.professionalId;
  }

  get requester(): Requester {
    return { ...this.props.requester };
  }

  get requesterName(): string {
    return `${this.props.requester.firstName} ${this.props.requester.lastName}`;
  }

  get startsAt(): Date {
    return this.props.startsAt;
  }

  get endsAt(): Date {
    return new Date(this.props.startsAt.getTime() + this.props.durationMinutes * 60_000);
  }

  get durationMinutes(): number {
    return this.props.durationMinutes;
  }

  get modality(): BookingModality {
    return this.props.modality;
  }

  get reason(): string | null {
    return this.props.reason;
  }

  get status(): BookingRequestStatus {
    return this.props.status;
  }

  get isPending(): boolean {
    return this.props.status === 'pending';
  }

  get patientId(): string | null {
    return this.props.patientId;
  }

  get appointmentId(): string | null {
    return this.props.appointmentId;
  }

  get rejectionReason(): string | null {
    return this.props.rejectionReason;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get decidedAt(): Date | null {
    return this.props.decidedAt;
  }
}
