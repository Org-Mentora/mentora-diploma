import { NavLink, Outlet } from 'react-router';
import { useTranslation } from '@/shared/i18n';
import { cn } from '@/shared/lib/utils';
import { useSettingsNavigationViewModel } from '../viewmodel/useSettingsNavigationViewModel';

function revealWhenCurrent(element: HTMLAnchorElement | null) {
  if (element?.getAttribute('aria-current') === 'page') {
    element.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }
}

export function SettingsLayout() {
  const { t } = useTranslation();
  const vm = useSettingsNavigationViewModel();
  return (
    <div className="grid grid-cols-1 gap-6">
      <h1 className="font-semibold text-2xl tracking-tight">{t('nav.settings')}</h1>
      <div className="grid gap-6 md:grid-cols-[13rem_minmax(0,1fr)] md:items-start lg:gap-10">
        <nav
          aria-label={t('nav.settings')}
          className="-mx-4 flex gap-1 overflow-x-auto border-b px-4 [mask-image:linear-gradient(to_right,transparent,black_1rem,black_calc(100%-2rem),transparent)] [scrollbar-width:none] md:sticky md:top-20 md:mx-0 md:flex-col md:overflow-visible md:border-b-0 md:px-0 md:[mask-image:none] [&::-webkit-scrollbar]:hidden"
        >
          {vm.sections.map((section) => (
            <NavLink
              key={section.to}
              to={section.to}
              ref={revealWhenCurrent}
              className={({ isActive }) =>
                cn(
                  '-mb-px shrink-0 whitespace-nowrap border-transparent border-b-2 px-3 py-2.5 text-muted-foreground text-sm transition-colors hover:text-foreground',
                  'md:mb-0 md:whitespace-normal md:rounded-md md:border-b-0 md:py-2 md:hover:bg-accent',
                  isActive && 'border-primary font-medium text-foreground md:bg-accent',
                )
              }
            >
              {t(section.label)}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
