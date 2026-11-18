import type {
  ConsultationDto,
  ConsultationSummaryDto,
  DiagnosisCatalogEntryDto,
  DiagnosisHistoryEntryDto,
} from '@mentora/contracts';
import { format } from 'date-fns';
import { translate as t } from '@/shared/i18n';

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

const typeLabel = (type: ConsultationDto['type']) => t(`agenda.modality.${type}`);

const dateTime = (iso: string) => format(new Date(iso), 'dd/MM/yyyy HH:mm');
const date = (iso: string) => format(new Date(iso), 'dd/MM/yyyy');
const diagnosisLabel = (d: { code: string; name: string }) => `${d.code} · ${d.name}`;

// Adapter
export class ClinicalRecordAdapter {
  static toTimeline(consultations: ConsultationSummaryDto[]): TimelineItem[] {
    return consultations.map((c) => ({
      id: c.id,
      dateLabel: dateTime(c.date),
      typeLabel: typeLabel(c.type),
      reason: c.reason,
      diagnosisLabel: c.diagnosis ? diagnosisLabel(c.diagnosis) : null,
      medicationsLabel:
        c.medicationCount === 0
          ? t('clinical.noMedication')
          : t('clinical.medications', { count: c.medicationCount }),
    }));
  }

  static toDetail(dto: ConsultationDto): ConsultationDetail {
    return {
      title: t('clinical.consultationOf', { date: dateTime(dto.date) }),
      typeLabel: typeLabel(dto.type),
      reason: dto.reason,
      observations: dto.observations,
      evolution: dto.evolution ?? t('clinical.noEvolution'),
      diagnosisLabel: dto.diagnosis ? diagnosisLabel(dto.diagnosis) : t('clinical.noDiagnosis'),
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
      dateLabel: t('clinical.assigned', {
        assigned: date(entry.diagnosis.assignedAt),
        consultation: date(entry.consultationDate),
      }),
    }));
  }

  static toDiagnosisOption(entry: DiagnosisCatalogEntryDto): DiagnosisOption {
    return { ...entry, label: diagnosisLabel(entry) };
  }
}
