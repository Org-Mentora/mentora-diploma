import { Languages } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import { NativeSelect } from '@/shared/ui/select';
import { useLanguageViewModel } from '../viewmodel/useLanguageViewModel';

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const vm = useLanguageViewModel();

  return (
    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
      <Languages className="size-4" aria-hidden />
      <NativeSelect
        aria-label={t('preferences.language.title')}
        className="h-8 w-auto py-0 pr-7 pl-2 text-xs"
        value={vm.language}
        onChange={(event) => vm.change(event.target.value)}
      >
        {vm.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.nativeName}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
