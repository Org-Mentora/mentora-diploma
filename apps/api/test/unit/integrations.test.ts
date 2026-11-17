import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TransactionManager } from '#core/model/TransactionManager';
import { IntervalJobScheduler } from '#infrastructure/scheduling/IntervalJobScheduler';
import { MailEmailGateway } from '../../src/modules/notifications/infrastructure/MailEmailGateway';
import { WhatsAppCloudApiGateway } from '../../src/modules/notifications/infrastructure/WhatsAppCloudApiGateway';
import type { Notification } from '../../src/modules/notifications/model/Notification';
import { NotificationCenter } from '../../src/modules/notifications/model/NotificationCenter';
import { NotificationRepository } from '../../src/modules/notifications/model/NotificationRepository';
import { Patient } from '../../src/modules/patients/model/Patient';
import { GoogleMeetLinkProvider } from '../../src/modules/virtual-consultations/infrastructure/GoogleMeetLinkProvider';
import { JitsiMeetingLinkProvider } from '../../src/modules/virtual-consultations/infrastructure/JitsiMeetingLinkProvider';
import {
  AppointmentLookup,
  MeetingInvitations,
  MeetingLinkProvider,
  MeetingProviderError,
  PatientContacts,
  VirtualMeetingRepository,
} from '../../src/modules/virtual-consultations/model/ports';
import { VirtualConsultationService } from '../../src/modules/virtual-consultations/model/VirtualConsultationService';
import type { VirtualMeeting } from '../../src/modules/virtual-consultations/model/VirtualMeeting';
import { CapturingMailTransport, FixedClock, RecordingWhatsApp } from '../support/fakes';

const now = new Date('2030-01-01T12:00:00.000Z');
const clock = new FixedClock(now);
const noTransaction: TransactionManager = { run: (work) => work() };

class MemoryNotifications extends NotificationRepository {
  readonly saved: Notification[] = [];
  async findById() {
    return null;
  }
  async findAll() {
    return this.saved;
  }
  async save(notification: Notification) {
    this.saved.push(notification);
  }
  async delete() {
    return false;
  }
  async findByPatient() {
    return this.saved;
  }
}

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('NotificationCenter (CU-14, CU-15)', () => {
  const message = {
    professionalId: 'p',
    patientId: 'x',
    topic: 'virtual_meeting' as const,
    body: 'Hi',
  };
  const setup = () => {
    const repo = new MemoryNotifications();
    const whatsapp = new RecordingWhatsApp();
    const mail = new CapturingMailTransport();
    const center = new NotificationCenter(repo, whatsapp, new MailEmailGateway(mail), clock);
    return { repo, whatsapp, mail, center };
  };

  it('skips patients without phone or email', async () => {
    const { center } = setup();

    expect(await center.send({ ...message, phone: null, email: null })).toEqual({
      channel: 'whatsapp',
      status: 'skipped',
      error: 'The patient has no phone number or email',
    });
  });

  it('retries a transient whatsapp failure once and logs it as failed', async () => {
    const { repo, whatsapp, center } = setup();
    whatsapp.failNext(2);

    expect((await center.send({ ...message, phone: '1155550000', email: null })).status).toBe(
      'failed',
    );
    expect(repo.saved.at(-1)?.attempts).toBe(2);
  });

  it('falls back to email when the patient has no phone or whatsapp fails', async () => {
    const { repo, whatsapp, mail, center } = setup();

    const emailOnly = await center.send({ ...message, phone: null, email: 'ana@mail.com' });
    whatsapp.failNext(2);
    const afterFailure = await center.send({
      ...message,
      phone: '1155550000',
      email: 'ana@mail.com',
    });

    expect(emailOnly).toEqual({ channel: 'email', status: 'sent', error: null });
    expect(afterFailure).toEqual({ channel: 'email', status: 'sent', error: null });
    expect(mail.lastTo('ana@mail.com')).toEqual({
      to: 'ana@mail.com',
      subject: 'Your video consultation link',
      text: 'Hi',
    });
    expect(repo.saved.map((n) => [n.channel, n.status])).toEqual([
      ['email', 'sent'],
      ['whatsapp', 'failed'],
      ['email', 'sent'],
    ]);
  });
});

describe('WhatsAppCloudApiGateway (ADR-0030)', () => {
  it('posts a text message with the country code and returns the message id', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse(200, { messages: [{ id: 'wamid.1' }] }));
    const gateway = new WhatsAppCloudApiGateway({
      token: 'secret',
      phoneNumberId: '123',
      apiVersion: 'v21.0',
      defaultCountryCode: '54',
      fetch,
    });

    expect(await gateway.send('011 5555-1234', 'Hello')).toBe('wamid.1');
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://graph.facebook.com/v21.0/123/messages');
    expect(JSON.parse(String(init.body))).toMatchObject({
      to: '541155551234',
      text: { body: 'Hello' },
    });
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer secret');
  });

  it('marks unknown numbers as permanent and server errors as retryable', async () => {
    const gateway = (response: Response) =>
      new WhatsAppCloudApiGateway({
        token: 't',
        phoneNumberId: '1',
        apiVersion: 'v21.0',
        fetch: vi.fn().mockResolvedValue(response),
      });

    await expect(
      gateway(jsonResponse(400, { error: { message: 'not a WhatsApp user', code: 131026 } })).send(
        '+5491100000000',
        'x',
      ),
    ).rejects.toMatchObject({ permanent: true });
    await expect(gateway(jsonResponse(503, {})).send('+5491100000000', 'x')).rejects.toMatchObject({
      permanent: false,
    });
  });
});

describe('Meeting link providers (ADR-0031)', () => {
  it('Jitsi creates unguessable rooms', async () => {
    const jitsi = new JitsiMeetingLinkProvider('https://meet.jit.si/');
    const [a, b] = [await jitsi.create(), await jitsi.create()];
    expect(a).toMatch(/^https:\/\/meet\.jit\.si\/Mentora-[0-9a-f]{24}$/);
    expect(a).not.toBe(b);
  });

  it('Google Meet refreshes the token once and creates a calendar event with a conference', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { access_token: 'access', expires_in: 3600 }))
      .mockImplementation(async () =>
        jsonResponse(200, { hangoutLink: 'https://meet.google.com/abc-defg-hij' }),
      );
    const meet = new GoogleMeetLinkProvider({
      clientId: 'id',
      clientSecret: 'secret',
      refreshToken: 'refresh',
      calendarId: 'primary',
      fetch,
    });
    const request = { title: 'Consultation', startsAt: now, durationMinutes: 50 };

    expect(await meet.create(request)).toBe('https://meet.google.com/abc-defg-hij');
    await meet.create(request);
    expect(fetch).toHaveBeenCalledTimes(3);
    const [eventUrl, eventInit] = fetch.mock.calls[1] as [string, RequestInit];
    expect(eventUrl).toContain('/calendars/primary/events?conferenceDataVersion=1');
    expect(
      JSON.parse(String(eventInit.body)).conferenceData.createRequest.conferenceSolutionKey,
    ).toEqual({
      type: 'hangoutsMeet',
    });
  });

  it('Google Meet reports authorization errors as provider errors', async () => {
    const meet = new GoogleMeetLinkProvider({
      clientId: 'id',
      clientSecret: 'secret',
      refreshToken: 'revoked',
      calendarId: 'primary',
      fetch: vi.fn().mockResolvedValue(jsonResponse(400, { error_description: 'Token revoked' })),
    });
    await expect(meet.create({ title: 'x', startsAt: now, durationMinutes: 50 })).rejects.toThrow(
      MeetingProviderError,
    );
  });
});

describe('VirtualConsultationService (CU-15 step 2 alternative)', () => {
  it('answers 503 when the platform fails and stores nothing', async () => {
    const saved: VirtualMeeting[] = [];
    const service = new VirtualConsultationService(
      new (class extends VirtualMeetingRepository {
        async findById() {
          return null;
        }
        async findAll() {
          return saved;
        }
        async save(meeting: VirtualMeeting) {
          saved.push(meeting);
        }
        async delete() {
          return false;
        }
        async findByPatient() {
          return saved;
        }
        async findByAppointment() {
          return null;
        }
        async insertIfFirstForAppointment(meeting: VirtualMeeting) {
          saved.push(meeting);
          return true;
        }
      })(),
      new (class extends MeetingLinkProvider {
        readonly provider = 'jitsi' as const;
        async create(): Promise<string> {
          throw new MeetingProviderError('quota exceeded');
        }
      })(),
      new (class extends PatientContacts {
        async find() {
          return { fullName: 'Lucía Paz', phone: null, email: null };
        }
      })(),
      new (class extends AppointmentLookup {
        async find() {
          return null;
        }
      })(),
      new (class extends MeetingInvitations {
        async send() {
          return { status: 'sent' as const, error: null };
        }
      })(),
      noTransaction,
      clock,
    );

    await expect(service.start('p', { patientId: 'x', appointmentId: null })).rejects.toMatchObject(
      {
        kind: 'unavailable',
        code: 'MEETING_PROVIDER_UNAVAILABLE',
      },
    );
    expect(saved).toEqual([]);
  });
});

describe('Patient dormancy (CU-07)', () => {
  const details = {
    firstName: 'Lucía',
    lastName: 'Paz',
    dni: '30123456',
    birthDate: null,
    gender: null,
    phone: null,
    email: null,
    address: null,
    healthInsurance: null,
    memberNumber: null,
    familyContact: null,
    debt: 0,
    allergies: [],
    observations: null,
  };

  it('is dormant three calendar months after the last activity', () => {
    const patient = Patient.register('p', details, now);
    expect(patient.isDormantAt(new Date('2030-03-31T12:00:00.000Z'))).toBe(false);
    expect(patient.isDormantAt(new Date('2030-04-02T12:00:00.000Z'))).toBe(true);

    patient.recordClinicalActivity(new Date('2030-03-01T12:00:00.000Z'));
    patient.recordClinicalActivity(new Date('2030-02-01T12:00:00.000Z'));
    expect(patient.lastClinicalActivityAt).toEqual(new Date('2030-03-01T12:00:00.000Z'));
    expect(patient.isDormantAt(new Date('2030-04-02T12:00:00.000Z'))).toBe(false);
  });
});

describe('IntervalJobScheduler (ADR-0026)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs jobs on their interval, never overlapping, and survives failures', async () => {
    vi.useFakeTimers();
    const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), child: vi.fn() };
    let release: () => void = () => undefined;
    const slow = vi.fn(() => new Promise<void>((resolve) => (release = resolve)));
    const failing = vi.fn().mockRejectedValue(new Error('boom'));
    const scheduler = new IntervalJobScheduler(logger, null, 10);

    scheduler.start([
      { name: 'slow', intervalMs: 100, run: slow },
      { name: 'failing', intervalMs: 100, run: failing },
    ]);
    await vi.advanceTimersByTimeAsync(350);
    expect(slow).toHaveBeenCalledTimes(1);
    expect(failing).toHaveBeenCalledTimes(4);
    expect(logger.error).toHaveBeenCalledWith('Scheduled job failed', expect.anything());

    release();
    await vi.advanceTimersByTimeAsync(100);
    expect(slow).toHaveBeenCalledTimes(2);
    release();
    await scheduler.stop();
  });
});
