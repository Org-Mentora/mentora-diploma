export class WhatsAppDeliveryError extends Error {
  constructor(
    message: string,
    readonly permanent: boolean,
  ) {
    super(message);
    this.name = 'WhatsAppDeliveryError';
  }
}

// Strategy
export abstract class WhatsAppGateway {
  abstract send(to: string, body: string): Promise<string>;
}
