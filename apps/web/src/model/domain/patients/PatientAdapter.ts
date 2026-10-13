import type { PatientDto, PatientSummaryDto } from '@mentora/contracts';

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
  /** Label/value pairs for the overview card; empty values are shown as "—". */
  details: { label: string; value: string }[];
  observations: string | null;
}

const STATUS: Record<PatientStatus, { label: string; tone: StatusTone }> = {
  active: { label: 'Active', tone: 'success' },
  discharged: { label: 'Discharged', tone: 'secondary' },
  inactive: { label: 'Inactive', tone: 'warning' },
};

const EMPTY = '—';
const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

/** Adapter (ADR-0007): patient DTOs → display-ready models. */
export class PatientAdapter {
  static statusLabel(status: PatientStatus): string {
    return STATUS[status].label;
  }

  /** 30123456 → 30.123.456 */
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
      statusLabel: STATUS[dto.status].label,
      statusTone: STATUS[dto.status].tone,
    };
  }

  static toProfile(dto: PatientDto): PatientProfile {
    const age = dto.age === null ? null : `${dto.age} years`;
    const origin = dto.statusOrigin === 'automatic' ? 'automatically' : 'manually';
    return {
      id: dto.id,
      fullName: dto.fullName,
      headline: [`DNI ${PatientAdapter.formatDni(dto.dni)}`, age].filter(Boolean).join(' · '),
      status: dto.status,
      statusLabel: STATUS[dto.status].label,
      statusTone: STATUS[dto.status].tone,
      statusChange: `Since ${new Date(dto.statusChangedAt).toLocaleDateString()} (${origin})`,
      allergies: dto.allergies,
      observations: dto.observations,
      details: [
        { label: 'Birth date', value: PatientAdapter.date(dto.birthDate) },
        { label: 'Gender', value: dto.gender ?? EMPTY },
        { label: 'Phone', value: dto.phone ?? EMPTY },
        { label: 'Email', value: dto.email ?? EMPTY },
        { label: 'Address', value: dto.address ?? EMPTY },
        {
          label: 'Health insurance',
          value: dto.healthInsurance
            ? `${dto.healthInsurance}${dto.memberNumber ? ` · #${dto.memberNumber}` : ''}`
            : EMPTY,
        },
        {
          label: 'Family contact',
          value: dto.familyContact
            ? `${dto.familyContact.name} (${dto.familyContact.phone})`
            : EMPTY,
        },
        { label: 'Debt', value: dto.debt > 0 ? money.format(dto.debt) : 'No debt' },
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
