import { AlertTriangle, BarChart3, CalendarDays, LogOut, Settings, Users } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router';
import { LanguageMenuItems } from '@/features/preferences';
import { useTranslation } from '@/shared/i18n';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { PLAN_PATH, useSessionViewModel } from '../viewmodel/useSessionViewModel';

const NAV = [
  { to: '/patients', label: 'nav.patients', icon: Users, needsAccess: true },
  { to: '/agenda', label: 'nav.agenda', icon: CalendarDays, needsAccess: true },
  { to: '/reports', label: 'nav.reports', icon: BarChart3, needsAccess: true },
  { to: '/settings', label: 'nav.settings', icon: Settings, needsAccess: false },
];

export function AppShell() {
  const { t } = useTranslation();
  const { state, session, logout, isLoggingOut } = useSessionViewModel();
  const restricted = state === 'restricted';
  const nav = NAV.filter((item) => !restricted || !item.needsAccess);
  const showBottomNav = nav.length > 1;

  return (
    <div className="min-h-dvh bg-muted/30 text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:shadow-md"
      >
        {t('nav.skipToContent')}
      </a>
      <header className="sticky top-0 z-40 border-b bg-background print:hidden">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:gap-6">
          <Link to="/" className="font-semibold text-base tracking-tight">
            Mentora
          </Link>
          <nav aria-label={t('nav.main')} className="hidden items-center gap-1 md:flex">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex h-9 items-center gap-2 rounded-md px-3 text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-foreground',
                    isActive && 'bg-accent font-medium text-foreground',
                  )
                }
              >
                <Icon className="size-4" />
                {t(label)}
              </NavLink>
            ))}
          </nav>
          {session && (
            <div className="ml-auto flex items-center gap-3">
              <Link to={PLAN_PATH} className="hidden lg:inline-flex">
                <Badge variant={session.subscriptionTone}>{session.subscriptionLabel}</Badge>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={t('nav.account')}
                  className="flex items-center gap-3 rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:rounded-md lg:py-1 lg:pr-1 lg:pl-2 lg:hover:bg-accent"
                >
                  <span className="hidden text-right text-sm leading-tight lg:block">
                    <span className="block max-w-48 truncate font-medium">
                      {session.professionalName}
                    </span>
                    <span className="block max-w-48 truncate text-muted-foreground text-xs">
                      {session.specialty}
                    </span>
                  </span>
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-xs">
                    {session.initials}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="grid gap-1 px-2 py-1.5">
                    <p className="truncate font-medium text-sm">{session.professionalName}</p>
                    <p className="truncate text-muted-foreground text-xs">{session.specialty}</p>
                    <Link to={PLAN_PATH} className="mt-1 w-fit">
                      <Badge variant={session.subscriptionTone}>{session.subscriptionLabel}</Badge>
                    </Link>
                  </div>
                  <DropdownMenuSeparator />
                  <LanguageMenuItems />
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings/profile">
                      <Settings /> {t('nav.settings')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={isLoggingOut}
                    onSelect={() => void logout()}
                  >
                    <LogOut /> {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </header>
      {restricted && session && (
        <div
          role="alert"
          className="border-amber-300 border-b bg-amber-50 text-amber-900 print:hidden"
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-sm">
            <AlertTriangle className="size-4 shrink-0" />
            <span className="min-w-0 flex-1">
              {session.subscriptionLabel}. {t('nav.restricted')}
            </span>
            <Link to={PLAN_PATH} className="font-medium underline underline-offset-2">
              {t('nav.managePlan')}
            </Link>
          </div>
        </div>
      )}
      <main
        id="main"
        tabIndex={-1}
        className={cn(
          'mx-auto max-w-6xl px-4 py-6 print:max-w-none print:p-0',
          showBottomNav && 'pb-24 md:pb-6',
        )}
      >
        <Outlet />
      </main>
      {showBottomNav && (
        <nav
          aria-label={t('nav.main')}
          className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden print:hidden"
        >
          <ul className="mx-auto flex max-w-md">
            {nav.map(({ to, label, icon: Icon }) => (
              <li key={to} className="flex-1">
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[11px] text-muted-foreground transition-colors',
                      isActive && 'font-medium text-foreground',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                          isActive && 'bg-accent',
                        )}
                      >
                        <Icon className="size-5" />
                      </span>
                      <span className="max-w-full truncate">{t(label)}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
