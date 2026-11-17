import { NavLink, Outlet } from 'react-router';
import { cn } from '@/shared/lib/utils';

const SECTIONS = [
  { to: '/settings/profile', label: 'Professional data' },
  { to: '/settings/password', label: 'Password' },
  { to: '/settings/plan', label: 'Plan and payments' },
];

export function SettingsLayout() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="font-semibold text-2xl tracking-tight">Settings</h1>
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
              {section.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
