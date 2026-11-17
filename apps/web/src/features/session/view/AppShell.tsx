import { AlertTriangle, CalendarDays, LogOut, Settings, Users } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { PLAN_PATH, useSessionViewModel } from '../viewmodel/useSessionViewModel';

const NAV = [
  { to: '/patients', label: 'Patients', icon: Users, needsAccess: true },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays, needsAccess: true },
  { to: '/settings', label: 'Settings', icon: Settings, needsAccess: false },
];

export function AppShell() {
  const { state, session, logout, isLoggingOut } = useSessionViewModel();
  const restricted = state === 'restricted';
  const nav = NAV.filter((item) => !restricted || !item.needsAccess);

  return (
    <div className="min-h-dvh bg-muted/30 text-foreground">
      <header className="border-b bg-background print:hidden">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <span className="font-semibold tracking-tight">Mentora</span>
          <nav className="flex items-center gap-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent',
                    isActive && 'bg-accent font-medium',
                  )
                }
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
          {session && (
            <div className="ml-auto flex items-center gap-3">
              <Link to={PLAN_PATH} className="hidden sm:inline-flex">
                <Badge variant={session.subscriptionTone}>{session.subscriptionLabel}</Badge>
              </Link>
              <div className="hidden text-right text-sm leading-tight md:block">
                <p className="font-medium">{session.professionalName}</p>
                <p className="text-muted-foreground text-xs">{session.specialty}</p>
              </div>
              <span className="flex size-8 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-xs">
                {session.initials}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Log out"
                onClick={() => void logout()}
                disabled={isLoggingOut}
              >
                <LogOut />
              </Button>
            </div>
          )}
        </div>
      </header>
      {restricted && session && (
        <div
          role="alert"
          className="border-amber-300 border-b bg-amber-50 text-amber-900 print:hidden"
        >
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 text-sm">
            <AlertTriangle className="size-4 shrink-0" />
            <span>
              {session.subscriptionLabel}. Your data is safe: choose a plan or regularize the
              payment to use the practice again.
            </span>
            <Link to={PLAN_PATH} className="ml-auto font-medium underline">
              Manage plan
            </Link>
          </div>
        </div>
      )}
      <main className="mx-auto max-w-6xl px-4 py-6 print:max-w-none print:p-0">
        <Outlet />
      </main>
    </div>
  );
}
