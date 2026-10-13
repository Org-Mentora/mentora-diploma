import { CalendarDays, LogOut, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { useSessionViewModel } from '../viewmodel/useSessionViewModel';

const NAV = [
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
];

/** Layout of the protected area: navigation, professional and subscription status. */
export function AppShell() {
  const { session, logout, isLoggingOut } = useSessionViewModel();

  return (
    <div className="min-h-dvh bg-muted/30 text-foreground">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <span className="font-semibold tracking-tight">Mentora</span>
          <nav className="flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
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
                {label}
              </NavLink>
            ))}
          </nav>
          {session && (
            <div className="ml-auto flex items-center gap-3">
              <Badge variant={session.subscriptionTone} className="hidden sm:inline-flex">
                {session.subscriptionLabel}
              </Badge>
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
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
