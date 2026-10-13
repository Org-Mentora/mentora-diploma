import { NotFoundError, ValidationError } from '#core/errors/ApplicationError';
import type { Clock } from '#core/model/Clock';
import { AssignedDiagnosis } from './AssignedDiagnosis';
import { ClinicalRecord, type DiagnosisHistoryEntry } from './ClinicalRecord';
import type { ClinicalRecordRepository } from './ClinicalRecordRepository';
import { Consultation, type ConsultationType } from './Consultation';
import type { DiagnosisResolver } from './DiagnosisResolver';
import { Medication, type MedicationData } from './Medication';
import type { PatientLookup } from './PatientLookup';

export interface RegisterConsultationData {
  date: Date;
  type: ConsultationType;
  reason: string;
  observations: string | null;
  evolution: string | null;
  /** DSM-5 code chosen in CU-11; `null` when no diagnosis is assigned (step 8 alternative). */
  diagnosisCode: string | null;
  medications: MedicationData[];
}

/** Model service for CU-08, CU-09, CU-11 and CU-12. */
export class ClinicalRecordService {
  constructor(
    private readonly records: ClinicalRecordRepository,
    private readonly patients: PatientLookup,
    private readonly diagnoses: DiagnosisResolver,
    private readonly clock: Clock,
  ) {}

  /** CU-08. A patient without consultations gets an empty, unsaved record. */
  async getRecord(professionalId: string, patientId: string): Promise<ClinicalRecord> {
    await this.assertPatient(professionalId, patientId);
    const record = await this.records.findByPatient(professionalId, patientId);
    return record ?? ClinicalRecord.open(professionalId, patientId, this.clock.now());
  }

  /** CU-09 (+ CU-11 diagnosis, CU-12 medications). */
  async registerConsultation(
    professionalId: string,
    patientId: string,
    data: RegisterConsultationData,
  ): Promise<Consultation> {
    await this.assertPatient(professionalId, patientId);
    const now = this.clock.now();

    const consultation = Consultation.record(
      {
        date: data.date,
        type: data.type,
        reason: data.reason,
        observations: data.observations,
        evolution: data.evolution,
        diagnosis: await this.assignDiagnosis(data.diagnosisCode, now),
        medications: data.medications.map((medication) => Medication.prescribe(medication, now)),
      },
      now,
    );

    const record =
      (await this.records.findByPatient(professionalId, patientId)) ??
      ClinicalRecord.open(professionalId, patientId, now);
    record.addConsultation(consultation, now);
    await this.records.save(record);
    return consultation;
  }

  async getConsultation(
    professionalId: string,
    patientId: string,
    consultationId: string,
  ): Promise<Consultation> {
    const record = await this.getRecord(professionalId, patientId);
    const consultation = record.findConsultation(consultationId);
    if (!consultation) {
      throw new NotFoundError('Consultation', consultationId);
    }
    return consultation;
  }

  /** CU-11 step 10. */
  async diagnosisHistory(
    professionalId: string,
    patientId: string,
  ): Promise<DiagnosisHistoryEntry[]> {
    return (await this.getRecord(professionalId, patientId)).diagnosisHistory();
  }

  private async assignDiagnosis(code: string | null, now: Date): Promise<AssignedDiagnosis | null> {
    if (!code) {
      return null;
    }
    const diagnosis = await this.diagnoses.resolve(code);
    if (!diagnosis) {
      throw new ValidationError(`'${code}' is not a diagnosis of the DSM-5 catalog`, {
        field: 'diagnosisCode',
      });
    }
    return AssignedDiagnosis.assign(diagnosis.code, diagnosis.name, now);
  }

  private async assertPatient(professionalId: string, patientId: string): Promise<void> {
    if (!(await this.patients.exists(professionalId, patientId))) {
      throw new NotFoundError('Patient', patientId);
    }
  }
}
