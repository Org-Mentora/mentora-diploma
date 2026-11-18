import type { Page } from '#core/model/Pagination';
import { CursorCodec } from '#core/presenter/CursorCodec';
import type {
  ClinicalRecordDto,
  ConsultationDto,
  DiagnosisHistoryEntryDto,
} from '../contracts/clinical-records.contracts';
import type { AssignedDiagnosis } from '../model/AssignedDiagnosis';
import type { ClinicalRecord, DiagnosisHistoryEntry } from '../model/ClinicalRecord';
import type { Consultation } from '../model/Consultation';

export class ClinicalRecordViewModel {
  static record(record: ClinicalRecord, consultations: Page<Consultation>): ClinicalRecordDto {
    return {
      patientId: record.patientId,
      openedAt: record.openedAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      consultations: CursorCodec.toDto(consultations, (c) => ({
        id: c.id,
        date: c.date.toISOString(),
        type: c.type,
        reason: c.reason,
        diagnosis: ClinicalRecordViewModel.diagnosis(c.diagnosis),
        medicationCount: c.medications.length,
      })),
    };
  }

  static consultation(consultation: Consultation): ConsultationDto {
    return {
      id: consultation.id,
      date: consultation.date.toISOString(),
      type: consultation.type,
      reason: consultation.reason,
      observations: consultation.observations,
      evolution: consultation.evolution,
      diagnosis: ClinicalRecordViewModel.diagnosis(consultation.diagnosis),
      medications: consultation.medications.map((m) => ({
        name: m.name,
        dose: m.dose,
        frequency: m.frequency,
        duration: m.duration,
        indications: m.indications,
        prescribedAt: m.prescribedAt.toISOString(),
      })),
      recordedAt: consultation.recordedAt.toISOString(),
    };
  }

  static diagnosisEntry(entry: DiagnosisHistoryEntry): DiagnosisHistoryEntryDto {
    return {
      consultationId: entry.consultationId,
      consultationDate: entry.consultationDate.toISOString(),
      diagnosis: {
        code: entry.diagnosis.code,
        name: entry.diagnosis.name,
        assignedAt: entry.diagnosis.assignedAt.toISOString(),
      },
    };
  }

  private static diagnosis(diagnosis: AssignedDiagnosis | null) {
    return diagnosis
      ? {
          code: diagnosis.code,
          name: diagnosis.name,
          assignedAt: diagnosis.assignedAt.toISOString(),
        }
      : null;
  }
}
