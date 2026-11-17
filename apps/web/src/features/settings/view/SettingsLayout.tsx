import { NavLink, Outlet } from 'react-router';
import { useTranslation } from '@/shared/i18n';
import { cn } from '@/shared/lib/utils';

const SECTIONS = [
  { to: '/settings/profile', label: 'settings.section.profile' },
  { to: '/settings/password', label: 'settings.section.password' },
  { to: '/settings/plan', label: 'settings.section.plan' },
  { to: '/settings/booking', label: 'settings.section.booking' },
  { to: '/settings/fees', label: 'settings.section.fees' },
  { to: '/settings/activity', label: 'settings.section.activity' },
  { to: '/settings/preferences', label: 'settings.section.preferences' },
];

export function SettingsLayout() {
  const { t } = useTranslation();
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="font-semibold text-2xl tracking-tight">{t('nav.settings')}</h1>
        <nav className="flex flex-wrap gap-1 border-b">
          {SECTIONS.map((section) => (
            <NavLink
              key={section.to}
              to={section.to}
              className={({ isActive }) =>
                cn(
                  '-mb-px border-transparent border-b-2 px-3 py-2 text-muted-foreground text-sm hover:text-foreground',
                  isActive && 'border-primary font-medium text-foreground',
                )
              }
            >
              {t(section.label)}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
