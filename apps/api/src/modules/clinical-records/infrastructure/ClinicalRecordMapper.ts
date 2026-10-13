import type { DataMapper } from '#core/model/DataMapper';
import { AssignedDiagnosis } from '../model/AssignedDiagnosis';
import { ClinicalRecord } from '../model/ClinicalRecord';
import { Consultation } from '../model/Consultation';
import { Medication } from '../model/Medication';
import type { ClinicalRecordDocument, ConsultationDocument } from './ClinicalRecordSchema';

export class ClinicalRecordMapper implements DataMapper<ClinicalRecord, ClinicalRecordDocument> {
  toDomain(record: ClinicalRecordDocument): ClinicalRecord {
    return ClinicalRecord.restore(record._id, {
      professionalId: record.professionalId,
      patientId: record.patientId,
      openedAt: record.openedAt,
      updatedAt: record.updatedAt,
      consultations: record.consultations.map((c) => this.consultationToDomain(c)),
    });
  }

  toPersistence(record: ClinicalRecord): ClinicalRecordDocument {
    return {
      _id: record.id,
      professionalId: record.professionalId,
      patientId: record.patientId,
      openedAt: record.openedAt,
      updatedAt: record.updatedAt,
      consultations: record.consultations.map((c) => this.consultationToPersistence(c)),
    };
  }

  private consultationToDomain(doc: ConsultationDocument): Consultation {
    return Consultation.restore(doc._id, {
      date: doc.date,
      type: doc.type,
      reason: doc.reason,
      observations: doc.observations,
      evolution: doc.evolution,
      diagnosis: doc.diagnosis
        ? AssignedDiagnosis.assign(doc.diagnosis.code, doc.diagnosis.name, doc.diagnosis.assignedAt)
        : null,
      medications: doc.medications.map((m) => Medication.restore({ ...m })),
      recordedAt: doc.recordedAt,
    });
  }

  private consultationToPersistence(consultation: Consultation): ConsultationDocument {
    const { diagnosis } = consultation;
    return {
      _id: consultation.id,
      date: consultation.date,
      type: consultation.type,
      reason: consultation.reason,
      observations: consultation.observations,
      evolution: consultation.evolution,
      diagnosis: diagnosis
        ? { code: diagnosis.code, name: diagnosis.name, assignedAt: diagnosis.assignedAt }
        : null,
      medications: consultation.medications.map((m) => ({
        name: m.name,
        dose: m.dose,
        frequency: m.frequency,
        duration: m.duration,
        indications: m.indications,
        prescribedAt: m.prescribedAt,
      })),
      recordedAt: consultation.recordedAt,
    };
  }
}
