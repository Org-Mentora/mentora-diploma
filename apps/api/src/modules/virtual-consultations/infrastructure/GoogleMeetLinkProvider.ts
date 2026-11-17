import { MeetingLinkProvider, MeetingProviderError, type MeetingRequest } from '../model/ports';

export interface GoogleMeetOptions {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  calendarId: string;
  fetch?: typeof fetch;
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error_description?: string;
}

interface EventResponse {
  hangoutLink?: string;
  conferenceData?: { entryPoints?: { entryPointType: string; uri: string }[] };
  error?: { message?: string };
}

const MINUTE_MS = 60_000;

// Adapter
export class GoogleMeetLinkProvider extends MeetingLinkProvider {
  readonly provider = 'google_meet' as const;
  readonly #fetch: typeof fetch;
  #token: { value: string; expiresAt: number } | null = null;

  constructor(private readonly options: GoogleMeetOptions) {
    super();
    this.#fetch = options.fetch ?? fetch;
  }

  async create(request: MeetingRequest): Promise<string> {
    const token = await this.accessToken();
    const calendar = encodeURIComponent(this.options.calendarId);
    const response = await this.call(
      `https://www.googleapis.com/calendar/v3/calendars/${calendar}/events?conferenceDataVersion=1`,
      {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          summary: request.title,
          start: { dateTime: request.startsAt.toISOString() },
          end: {
            dateTime: new Date(
              request.startsAt.getTime() + request.durationMinutes * MINUTE_MS,
            ).toISOString(),
          },
          conferenceData: {
            createRequest: {
              requestId: crypto.randomUUID(),
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
        }),
      },
    );
    const event = (await response.json()) as EventResponse;
    const link =
      event.hangoutLink ??
      event.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri;
    if (!response.ok || !link) {
      throw new MeetingProviderError(event.error?.message ?? `Google answered ${response.status}`);
    }
    return link;
  }

  private async accessToken(): Promise<string> {
    if (this.#token && this.#token.expiresAt > Date.now() + MINUTE_MS) {
      return this.#token.value;
    }
    const response = await this.call('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.options.clientId,
        client_secret: this.options.clientSecret,
        refresh_token: this.options.refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    const payload = (await response.json()) as TokenResponse;
    if (!response.ok || !payload.access_token) {
      throw new MeetingProviderError(payload.error_description ?? 'Google authorization failed');
    }
    this.#token = {
      value: payload.access_token,
      expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
    };
    return this.#token.value;
  }

  private async call(url: string, init: RequestInit): Promise<Response> {
    try {
      return await this.#fetch(url, init);
    } catch (error) {
      throw new MeetingProviderError(
        `Google is unreachable: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }
}
