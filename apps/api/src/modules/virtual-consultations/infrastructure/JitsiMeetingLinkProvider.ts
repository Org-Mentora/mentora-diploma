import { randomBytes } from 'node:crypto';
import { MeetingLinkProvider } from '../model/ports';

// Adapter
export class JitsiMeetingLinkProvider extends MeetingLinkProvider {
  readonly provider = 'jitsi' as const;

  constructor(private readonly baseUrl: string) {
    super();
  }

  async create(): Promise<string> {
    const room = `Mentora-${randomBytes(12).toString('hex')}`;
    return `${this.baseUrl.replace(/\/$/, '')}/${room}`;
  }
}
