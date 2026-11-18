import type { Page, PageRequest } from '#core/model/Pagination';

export type RecordAccessAction =
  | 'view_record'
  | 'view_consultation'
  | 'view_diagnoses'
  | 'register_consultation';

export interface RecordAccess {
  professionalId: string;
  patientId: string;
  action: RecordAccessAction;
  consultationId: string | null;
  at: Date;
}

export abstract class RecordAccessLog {
  abstract append(access: RecordAccess): Promise<void>;
  abstract findByPatient(
    professionalId: string,
    patientId: string,
    page: PageRequest,
  ): Promise<Page<RecordAccess>>;
}
