export abstract class IdGenerator {
  abstract next(): string;
}

export class UuidIdGenerator extends IdGenerator {
  next(): string {
    return crypto.randomUUID();
  }
}
