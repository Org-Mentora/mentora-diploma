import { NotFoundError, ValidationError } from '#core/errors/ApplicationError';
import type { Clock } from '#core/model/Clock';
import type { TransactionManager } from '#core/model/TransactionManager';
import { AssignedDiagnosis } from './AssignedDiagnosis';
import type { ClinicalActivityRecorder } from './ClinicalActivityRecorder';
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
  diagnosisCode: string | null;
  medications: MedicationData[];
}

export class ClinicalRecordService {
  constructor(
    private readonly records: ClinicalRecordRepository,
    private readonly transactions: TransactionManager,
    private readonly patients: PatientLookup,
    private readonly activity: ClinicalActivityRecorder,
    private readonly diagnoses: DiagnosisResolver,
    private readonly clock: Clock,
  ) {}

  async getRecord(professionalId: string, patientId: string): Promise<ClinicalRecord> {
    await this.assertPatient(professionalId, patientId);
    const record = await this.records.findByPatient(professionalId, patientId);
    return record ?? ClinicalRecord.open(professionalId, patientId, this.clock.now());
  }

  registerConsultation(
    professionalId: string,
    patientId: string,
    data: RegisterConsultationData,
  ): Promise<Consultation> {
    return this.transactions.run(() => this.appendConsultation(professionalId, patientId, data));
  }

  private async appendConsultation(
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
    await this.activity.record(professionalId, patientId, consultation.date);
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
