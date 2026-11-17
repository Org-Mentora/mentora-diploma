export abstract class AgendaLock {
  abstract acquire(professionalId: string): Promise<void>;
}
