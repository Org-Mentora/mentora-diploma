import type { AuditEventDto } from '@mentora/contracts';
import { translate as t } from '@/shared/i18n';
import { Formats } from '../format/Formats';

export const AUDIT_CATEGORIES = [
  'session',
  'account',
  'patient',
  'consultation',
  'appointment',
  'booking',
  'fees',
  'subscription',
  'payment',
  'payment_method',
  'virtual_meeting',
] as const;

export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

export type AuditTone = 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';

export interface AuditItem {
  id: string;
  title: string;
  categoryLabel: string;
  tone: AuditTone;
  actorLabel: string;
  subject: string | null;
  details: string[];
  when: string;
  origin: string | null;
}

const SUBJECT_KEYS = ['patientName', 'requesterName', 'email'];
const HIDDEN_KEYS = new Set([
  ...SUBJECT_KEYS,
  'patientId',
  'appointmentId',
  'consultationId',
  'paymentMethodId',
  'paymentId',
  'meetingId',
]);

const TONE: Partial<Record<string, AuditTone>> = {
  'session.login_failed': 'danger',
  'patient.inactivated': 'warning',
  'appointment.cancelled': 'warning',
  'booking.rejected': 'warning',
  'subscription.cancelled': 'warning',
  'payment_method.removed': 'warning',
  'booking.requested': 'success',
  'booking.accepted': 'success',
};

function browserOf(userAgent: string | null): string | null {
  if (!userAgent) {
    return null;
  }
  const match = /(Edg|Firefox|Chrome|Safari)\//.exec(userAgent);
  const names: Record<string, string> = {
    Edg: 'Edge',
    Firefox: 'Firefox',
    Chrome: 'Chrome',
    Safari: 'Safari',
  };
  return match?.[1] ? (names[match[1]] ?? null) : null;
}

function formatValue(value: string | number | boolean | null): string {
  if (value === null) {
    return '—';
  }
  if (typeof value === 'boolean') {
    return t(value ? 'common.yes' : 'common.no');
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return Formats.date(value, 'dateTime');
  }
  if (
    typeof value === 'string' &&
    /^(first_visit|control|follow_up|medication|other)$/.test(value)
  ) {
    return t(`agenda.type.${value}`);
  }
  if (value === 'in_person' || value === 'virtual') {
    return t(`agenda.modality.${value}`);
  }
  if (value === 'online' || value === 'agenda') {
    return t(`audit.source.${value}`);
  }
  return String(value);
}

function detailLabel(key: string): string {
  if (/^(first_visit|control|follow_up|medication|other)$/.test(key)) {
    return t(`agenda.type.${key}`);
  }
  return t(`audit.detail.${key}`, { defaultValue: key });
}

// Adapter
export class AuditAdapter {
  static categoryLabel(category: string): string {
    return t(`audit.category.${category}`, { defaultValue: category });
  }

  static toItem(dto: AuditEventDto): AuditItem {
    const subjectKey = SUBJECT_KEYS.find((key) => typeof dto.details[key] === 'string');
    const details = Object.entries(dto.details)
      .filter(([key]) => !HIDDEN_KEYS.has(key))
      .map(([key, value]) => `${detailLabel(key)}: ${formatValue(value)}`);
    const origin = [dto.ip?.replace(/^::ffff:/, ''), browserOf(dto.userAgent)]
      .filter(Boolean)
      .join(' · ');
    return {
      id: dto.id,
      title: t(`audit.action.${dto.action}`, { defaultValue: dto.action }),
      categoryLabel: AuditAdapter.categoryLabel(dto.category),
      tone: TONE[dto.action] ?? 'secondary',
      actorLabel: t(`audit.actor.${dto.actor}`),
      subject: subjectKey ? String(dto.details[subjectKey]) : null,
      details,
      when: Formats.date(dto.occurredAt, 'dateTime'),
      origin: origin || null,
    };
  }
}
