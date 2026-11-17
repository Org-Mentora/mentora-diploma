export abstract class EmailGateway {
  abstract send(to: string, subject: string, body: string): Promise<void>;
}
