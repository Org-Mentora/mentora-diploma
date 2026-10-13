import { Entity } from '#core/model/Entity';
import type { AssignedDiagnosis } from './AssignedDiagnosis';
import type { Consultation } from './Consultation';

export interface ClinicalRecordProps {
  professionalId: string;
  patientId: string;
  openedAt: Date;
  updatedAt: Date;
  consultations: Consultation[];
}

export interface DiagnosisHistoryEntry {
  consultationId: string;
  consultationDate: Date;
  diagnosis: AssignedDiagnosis;
}

/**
 * Aggregate root of a patient's clinical history (`HistoriaClinica`, ADR-0020). Consultations,
 * with their evolution, diagnosis and medications, only change through this class and are
 * never removed, so the history is append-only.
 */
export class ClinicalRecord extends Entity<ClinicalRecordProps> {
  static open(professionalId: string, patientId: string, now: Date): ClinicalRecord {
    return new ClinicalRecord(crypto.randomUUID(), {
      professionalId,
      patientId,
      openedAt: now,
      updatedAt: now,
      consultations: [],
    });
  }

  static restore(id: string, props: ClinicalRecordProps): ClinicalRecord {
    return new ClinicalRecord(id, props);
  }

  /** CU-09 step 9: incorporate the consultation into the history. */
  addConsultation(consultation: Consultation, now: Date): void {
    this.props = {
      ...this.props,
      consultations: [...this.props.consultations, consultation],
      updatedAt: now,
    };
  }

  /** CU-08: newest first. */
  consultationsChronological(): Consultation[] {
    return [...this.props.consultations].sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  findConsultation(consultationId: string): Consultation | null {
    return this.props.consultations.find((c) => c.id === consultationId) ?? null;
  }

  /**
   * CU-11 step 10: every diagnosis ever assigned, newest consultation first. Nothing is
   * overwritten: changing the diagnosis means a new consultation.
   */
  diagnosisHistory(): DiagnosisHistoryEntry[] {
    return this.props.consultations
      .flatMap((consultation) =>
        consultation.diagnosis
          ? [
              {
                consultationId: consultation.id,
                consultationDate: consultation.date,
                diagnosis: consultation.diagnosis,
              },
            ]
          : [],
      )
      .sort(
        (a, b) =>
          b.consultationDate.getTime() - a.consultationDate.getTime() ||
          b.diagnosis.assignedAt.getTime() - a.diagnosis.assignedAt.getTime(),
      );
  }

  get professionalId(): string {
    return this.props.professionalId;
  }

  get patientId(): string {
    return this.props.patientId;
  }

  get openedAt(): Date {
    return this.props.openedAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get consultations(): readonly Consultation[] {
    return this.props.consultations;
  }

  get isEmpty(): boolean {
    return this.props.consultations.length === 0;
  }
}
