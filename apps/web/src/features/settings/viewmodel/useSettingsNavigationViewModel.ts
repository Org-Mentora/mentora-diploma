import { useGetCurrentProfessionalQuery } from '@/model/api/generated/mentoraApi';
import { SessionAdapter } from '@/model/domain/session/SessionAdapter';

export interface SettingsSection {
  to: string;
  label: string;
}

export interface SettingsNavigationViewModel {
  sections: SettingsSection[];
}

const SECTIONS = [
  { to: '/settings/profile', label: 'settings.section.profile', needsAccess: false },
  { to: '/settings/password', label: 'settings.section.password', needsAccess: false },
  { to: '/settings/plan', label: 'settings.section.plan', needsAccess: false },
  { to: '/settings/booking', label: 'settings.section.booking', needsAccess: true },
  { to: '/settings/fees', label: 'settings.section.fees', needsAccess: true },
  { to: '/settings/activity', label: 'settings.section.activity', needsAccess: false },
  { to: '/settings/preferences', label: 'settings.section.preferences', needsAccess: false },
];

// ViewModel
export function useSettingsNavigationViewModel(): SettingsNavigationViewModel {
  const { data } = useGetCurrentProfessionalQuery();
  const hasAccess = data ? SessionAdapter.toUiModel(data).hasAccess : true;
  return {
    sections: SECTIONS.filter((section) => hasAccess || !section.needsAccess).map(
      ({ to, label }) => ({ to, label }),
    ),
  };
}
