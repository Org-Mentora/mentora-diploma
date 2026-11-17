import type { LogoDto, PatientDto, SessionDto } from '@mentora/contracts';
import { intlLocale, translate as t } from '@/shared/i18n';

export interface Letterhead {
  professionalName: string;
  specialty: string;
  license: string;
  contact: string;
  offices: string[];
  logoDataUrl: string | null;
  initials: string;
}

export interface PrescriptionDocument {
  letterhead: Letterhead;
  patientName: string;
  patientDetail: string;
  date: string;
  content: string;
  fileName: string;
}

const formatDni = (dni: string) => dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

function slug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export class PrescriptionBuilder {
  static letterhead(session: SessionDto, logo: LogoDto | undefined): Letterhead {
    const p = session.professional;
    return {
      professionalName: p.fullName,
      specialty: p.specialty,
      license: t('prescription.license', { number: p.licenseNumber }),
      contact: [p.email, p.phone].filter(Boolean).join(' · '),
      offices: p.offices,
      logoDataUrl: logo?.dataUrl ?? null,
      initials: `${p.firstName[0] ?? ''}${p.lastName[0] ?? ''}`.toUpperCase(),
    };
  }

  static build(
    letterhead: Letterhead,
    patient: PatientDto,
    content: string,
    at: Date,
  ): PrescriptionDocument {
    const isoDay = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(
      at.getDate(),
    ).padStart(2, '0')}`;
    const insurance = patient.healthInsurance
      ? ` · ${patient.healthInsurance}${patient.memberNumber ? ` #${patient.memberNumber}` : ''}`
      : '';
    return {
      letterhead,
      patientName: patient.fullName,
      patientDetail: `DNI ${formatDni(patient.dni)}${insurance}`,
      date: at.toLocaleDateString(intlLocale(), { day: 'numeric', month: 'long', year: 'numeric' }),
      content: content.trim(),
      fileName: `${t('prescription.fileName')}-${slug(patient.fullName)}-${isoDay}.pdf`,
    };
  }
}
