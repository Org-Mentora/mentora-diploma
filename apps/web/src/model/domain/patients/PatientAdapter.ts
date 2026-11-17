import type { PatientDto, PatientSummaryDto } from '@mentora/contracts';
import { translate as t } from '@/shared/i18n';
import { Formats } from '../format/Formats';

export type PatientStatus = PatientDto['status'];
export type StatusTone = 'success' | 'secondary' | 'warning';

export interface PatientListItem {
  id: string;
  fullName: string;
  dni: string;
  age: string;
  phone: string;
  healthInsurance: string;
  statusLabel: string;
  statusTone: StatusTone;
}

export interface PatientProfile {
  id: string;
  fullName: string;
  headline: string;
  status: PatientStatus;
  statusLabel: string;
  statusTone: StatusTone;
  statusChange: string;
  allergies: string[];
  details: { label: string; value: string }[];
  observations: string | null;
}

const TONE: Record<PatientStatus, StatusTone> = {
  active: 'success',
  discharged: 'secondary',
  inactive: 'warning',
};

const EMPTY = '—';

// Adapter
export class PatientAdapter {
  static statusLabel(status: PatientStatus): string {
    return t(`patients.status.${status}`);
  }

  static formatDni(dni: string): string {
    return dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  static toListItem(dto: PatientSummaryDto): PatientListItem {
    return {
      id: dto.id,
      fullName: dto.fullName,
      dni: PatientAdapter.formatDni(dto.dni),
      age: dto.age === null ? EMPTY : `${dto.age}`,
      phone: dto.phone ?? EMPTY,
      healthInsurance: dto.healthInsurance ?? EMPTY,
      statusLabel: PatientAdapter.statusLabel(dto.status),
      statusTone: TONE[dto.status],
    };
  }

  static toProfile(dto: PatientDto): PatientProfile {
    const age = dto.age === null ? null : t('patients.age', { count: dto.age });
    const origin = t(`patients.origin.${dto.statusOrigin}`);
    return {
      id: dto.id,
      fullName: dto.fullName,
      headline: [`DNI ${PatientAdapter.formatDni(dto.dni)}`, age].filter(Boolean).join(' · '),
      status: dto.status,
      statusLabel: PatientAdapter.statusLabel(dto.status),
      statusTone: TONE[dto.status],
      statusChange: t('patients.since', {
        date: Formats.date(dto.statusChangedAt, 'shortDate'),
        origin,
      }),
      allergies: dto.allergies,
      observations: dto.observations,
      details: [
        { label: t('patients.field.birthDate'), value: PatientAdapter.date(dto.birthDate) },
        { label: t('patients.field.gender'), value: dto.gender ?? EMPTY },
        { label: t('patients.field.phone'), value: dto.phone ?? EMPTY },
        { label: t('patients.field.email'), value: dto.email ?? EMPTY },
        { label: t('patients.field.address'), value: dto.address ?? EMPTY },
        {
          label: t('patients.field.healthInsurance'),
          value: dto.healthInsurance
            ? `${dto.healthInsurance}${dto.memberNumber ? ` · #${dto.memberNumber}` : ''}`
            : EMPTY,
        },
        {
          label: t('patients.field.familyContact'),
          value: dto.familyContact
            ? `${dto.familyContact.name} (${dto.familyContact.phone})`
            : EMPTY,
        },
        {
          label: t('patients.field.debt'),
          value: dto.debt > 0 ? Formats.money(dto.debt) : t('patients.noDebt'),
        },
        {
          label: t('patients.field.lastConsultation'),
          value: dto.lastConsultationAt
            ? Formats.date(dto.lastConsultationAt, 'shortDate')
            : t('patients.noneYet'),
        },
      ],
    };
  }

  private static date(isoDate: string | null): string {
    if (!isoDate) {
      return EMPTY;
    }
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  }
}
