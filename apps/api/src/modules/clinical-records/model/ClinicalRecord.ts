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

// Aggregate Root
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

  addConsultation(consultation: Consultation, now: Date): void {
    this.props = {
      ...this.props,
      consultations: [...this.props.consultations, consultation],
      updatedAt: now,
    };
  }

  consultationsChronological(): Consultation[] {
    return [...this.props.consultations].sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  findConsultation(consultationId: string): Consultation | null {
    return this.props.consultations.find((c) => c.id === consultationId) ?? null;
  }

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
}
