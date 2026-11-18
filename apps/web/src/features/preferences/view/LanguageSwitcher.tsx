import { Languages } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/shared/ui/dropdown-menu';
import { NativeSelect } from '@/shared/ui/select';
import { useLanguageViewModel } from '../viewmodel/useLanguageViewModel';

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const vm = useLanguageViewModel();

  return (
    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
      <Languages className="size-4 shrink-0" aria-hidden />
      <NativeSelect
        aria-label={t('preferences.language.title')}
        density="compact"
        className="w-auto"
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

export function LanguageMenuItems() {
  const { t } = useTranslation();
  const vm = useLanguageViewModel();

  return (
    <>
      <DropdownMenuLabel className="flex items-center gap-2">
        <Languages className="size-3.5" aria-hidden />
        {t('preferences.language.title')}
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup value={vm.language} onValueChange={vm.change}>
        {vm.options.map((option) => (
          <DropdownMenuRadioItem key={option.value} value={option.value}>
            {option.nativeName}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </>
  );
}
