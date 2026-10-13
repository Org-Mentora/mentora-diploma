import type {
  ClinicalRecordDto,
  ConsultationDto,
  DiagnosisCatalogEntryDto,
  DiagnosisHistoryEntryDto,
} from '@mentora/contracts';
import { format } from 'date-fns';

export interface TimelineItem {
  id: string;
  dateLabel: string;
  typeLabel: string;
  reason: string;
  diagnosisLabel: string | null;
  medicationsLabel: string;
}

export interface ConsultationDetail {
  title: string;
  typeLabel: string;
  reason: string;
  observations: string | null;
  evolution: string;
  diagnosisLabel: string;
  medications: { key: string; name: string; posology: string; indications: string | null }[];
}

export interface DiagnosisHistoryItem {
  key: string;
  label: string;
  dateLabel: string;
}

export interface DiagnosisOption {
  code: string;
  name: string;
  category: string;
  label: string;
}

const TYPE_LABEL: Record<ConsultationDto['type'], string> = {
  in_person: 'In person',
  virtual: 'Virtual',
};

const dateTime = (iso: string) => format(new Date(iso), 'dd/MM/yyyy HH:mm');
const date = (iso: string) => format(new Date(iso), 'dd/MM/yyyy');
const diagnosisLabel = (d: { code: string; name: string }) => `${d.code} · ${d.name}`;

/** Adapter (ADR-0007): clinical record DTOs → display-ready models (CU-08, CU-11). */
export class ClinicalRecordAdapter {
  static toTimeline(record: ClinicalRecordDto): TimelineItem[] {
    return record.consultations.map((c) => ({
      id: c.id,
      dateLabel: dateTime(c.date),
      typeLabel: TYPE_LABEL[c.type],
      reason: c.reason,
      diagnosisLabel: c.diagnosis ? diagnosisLabel(c.diagnosis) : null,
      medicationsLabel:
        c.medicationCount === 0
          ? 'No medication'
          : `${c.medicationCount} medication${c.medicationCount === 1 ? '' : 's'}`,
    }));
  }

  static toDetail(dto: ConsultationDto): ConsultationDetail {
    return {
      title: `Consultation of ${dateTime(dto.date)}`,
      typeLabel: TYPE_LABEL[dto.type],
      reason: dto.reason,
      observations: dto.observations,
      evolution: dto.evolution ?? 'No evolution recorded',
      diagnosisLabel: dto.diagnosis ? diagnosisLabel(dto.diagnosis) : 'No diagnosis assigned',
      medications: dto.medications.map((m, index) => ({
        key: `${m.name}-${index}`,
        name: m.name,
        posology: `${m.dose} · ${m.frequency} · ${m.duration}`,
        indications: m.indications,
      })),
    };
  }

  static toDiagnosisHistory(entries: DiagnosisHistoryEntryDto[]): DiagnosisHistoryItem[] {
    return entries.map((entry) => ({
      key: `${entry.consultationId}-${entry.diagnosis.code}`,
      label: diagnosisLabel(entry.diagnosis),
      dateLabel: `Assigned ${date(entry.diagnosis.assignedAt)} · consultation of ${date(entry.consultationDate)}`,
    }));
  }

  static toDiagnosisOption(entry: DiagnosisCatalogEntryDto): DiagnosisOption {
    return { ...entry, label: diagnosisLabel(entry) };
  }
}
