import type { Requester } from './BookingRequest';

export abstract class PatientRegistry {
  abstract findIdByDni(professionalId: string, dni: string): Promise<string | null>;
  abstract register(professionalId: string, requester: Requester): Promise<string>;
}
