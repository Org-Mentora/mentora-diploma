import { NotFoundError, ValidationError } from '#core/errors/ApplicationError';
import type { AuditTrail } from '#core/model/AuditTrail';
import type { Clock } from '#core/model/Clock';
import type { IdGenerator } from '#core/model/IdGenerator';
import type { TransactionManager } from '#core/model/TransactionManager';
import { AssignedDiagnosis } from './AssignedDiagnosis';
import type { ClinicalActivityRecorder } from './ClinicalActivityRecorder';
import { ClinicalRecord, type DiagnosisHistoryEntry } from './ClinicalRecord';
import type { ClinicalRecordRepository } from './ClinicalRecordRepository';
import { Consultation, type ConsultationType } from './Consultation';
import type { DiagnosisResolver } from './DiagnosisResolver';
import { Medication, type MedicationData } from './Medication';
import type { PatientLookup } from './PatientLookup';
import type { RecordAccess, RecordAccessAction, RecordAccessLog } from './RecordAccessLog';

export interface RegisterConsultationData {
  date: Date;
  type: ConsultationType;
  reason: string;
  observations: string | null;
  evolution: string | null;
  diagnosisCode: string | null;
  medications: MedicationData[];
}

const ACCESS_LOG_LIMIT = 100;

export class ClinicalRecordService {
  constructor(
    private readonly records: ClinicalRecordRepository,
    private readonly transactions: TransactionManager,
    private readonly patients: PatientLookup,
    private readonly activity: ClinicalActivityRecorder,
    private readonly diagnoses: DiagnosisResolver,
    private readonly clock: Clock,
    private readonly accesses: RecordAccessLog,
    private readonly ids: IdGenerator,
    private readonly trail: AuditTrail,
  ) {}

  async getRecord(professionalId: string, patientId: string): Promise<ClinicalRecord> {
    const record = await this.loadRecord(professionalId, patientId);
    await this.audit(professionalId, patientId, 'view_record');
    return record;
  }

  async accessLog(professionalId: string, patientId: string): Promise<RecordAccess[]> {
    await this.assertPatient(professionalId, patientId);
    return this.accesses.findByPatient(professionalId, patientId, ACCESS_LOG_LIMIT);
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
      this.ids.next(),
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
      ClinicalRecord.open(this.ids.next(), professionalId, patientId, now);
    record.addConsultation(consultation, now);
    await this.records.save(record);
    await this.activity.record(professionalId, patientId, consultation.date);
    await this.audit(professionalId, patientId, 'register_consultation', consultation.id);
    await this.trail.record({
      professionalId,
      action: 'consultation.registered',
      target: { type: 'patient', id: patientId },
      details: { consultationId: consultation.id, diagnosis: data.diagnosisCode ?? null },
    });
    return consultation;
  }

  async getConsultation(
    professionalId: string,
    patientId: string,
    consultationId: string,
  ): Promise<Consultation> {
    const record = await this.loadRecord(professionalId, patientId);
    const consultation = record.findConsultation(consultationId);
    if (!consultation) {
      throw new NotFoundError('Consultation', consultationId);
    }
    await this.audit(professionalId, patientId, 'view_consultation', consultation.id);
    return consultation;
  }

  async diagnosisHistory(
    professionalId: string,
    patientId: string,
  ): Promise<DiagnosisHistoryEntry[]> {
    const record = await this.loadRecord(professionalId, patientId);
    await this.audit(professionalId, patientId, 'view_diagnoses');
    return record.diagnosisHistory();
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

  private async loadRecord(professionalId: string, patientId: string): Promise<ClinicalRecord> {
    await this.assertPatient(professionalId, patientId);
    const record = await this.records.findByPatient(professionalId, patientId);
    return (
      record ?? ClinicalRecord.open(this.ids.next(), professionalId, patientId, this.clock.now())
    );
  }

  private audit(
    professionalId: string,
    patientId: string,
    action: RecordAccessAction,
    consultationId: string | null = null,
  ): Promise<void> {
    return this.accesses.append({
      professionalId,
      patientId,
      action,
      consultationId,
      at: this.clock.now(),
    });
  }

  private async assertPatient(professionalId: string, patientId: string): Promise<void> {
    if (!(await this.patients.exists(professionalId, patientId))) {
      throw new NotFoundError('Patient', patientId);
    }
  }
}
