import { WhatsAppDeliveryError, WhatsAppGateway } from '../model/WhatsAppGateway';

export interface WhatsAppCloudApiOptions {
  token: string;
  phoneNumberId: string;
  apiVersion: string;
  defaultCountryCode?: string;
  fetch?: typeof fetch;
}

interface GraphResponse {
  messages?: { id: string }[];
  error?: { message?: string; code?: number };
}

const PERMANENT_CODES = new Set([100, 131009, 131026, 131030]);

const REQUEST_TIMEOUT_MS = 10_000;

// Adapter
export class WhatsAppCloudApiGateway extends WhatsAppGateway {
  readonly #fetch: typeof fetch;

  constructor(private readonly options: WhatsAppCloudApiOptions) {
    super();
    this.#fetch = options.fetch ?? fetch;
  }

  async send(to: string, body: string): Promise<string> {
    const url = `https://graph.facebook.com/${this.options.apiVersion}/${this.options.phoneNumberId}/messages`;
    let response: Response;
    try {
      response = await this.#fetch(url, {
        method: 'POST',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          authorization: `Bearer ${this.options.token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: this.normalize(to),
          type: 'text',
          text: { body },
        }),
      });
    } catch (error) {
      throw new WhatsAppDeliveryError(
        `WhatsApp API unreachable: ${error instanceof Error ? error.message : 'unknown'}`,
        false,
      );
    }
    const payload = (await response.json().catch(() => ({}))) as GraphResponse;
    const messageId = payload.messages?.[0]?.id;
    if (response.ok && messageId) {
      return messageId;
    }
    const code = payload.error?.code;
    throw new WhatsAppDeliveryError(
      payload.error?.message ?? `WhatsApp API answered ${response.status}`,
      code !== undefined && PERMANENT_CODES.has(code),
    );
  }

  private normalize(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (phone.trim().startsWith('+') || !this.options.defaultCountryCode) {
      return digits;
    }
    return digits.startsWith(this.options.defaultCountryCode)
      ? digits
      : `${this.options.defaultCountryCode}${digits.replace(/^0/, '')}`;
  }
}
