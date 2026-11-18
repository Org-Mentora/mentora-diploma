import { Check } from 'lucide-react';
import { useTranslation } from '@/shared/i18n';
import { cn } from '@/shared/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { useLanguageViewModel } from '../viewmodel/useLanguageViewModel';

export function PreferencesPage() {
  const { t } = useTranslation();
  const vm = useLanguageViewModel();

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{t('preferences.language.title')}</CardTitle>
        <CardDescription>{t('preferences.language.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="sr-only">{t('preferences.language.title')}</legend>
          {vm.options.map((option) => {
            const selected = option.value === vm.language;
            return (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary',
                  selected && 'border-primary ring-1 ring-primary',
                )}
              >
                <input
                  type="radio"
                  name="language"
                  className="sr-only"
                  value={option.value}
                  checked={selected}
                  onChange={() => vm.change(option.value)}
                />
                <span className="grid">
                  <span className="font-medium">{option.nativeName}</span>
                  {option.label !== option.nativeName && (
                    <span className="text-muted-foreground text-sm">{option.label}</span>
                  )}
                </span>
                {selected && <Check className="size-4 text-primary" aria-hidden />}
              </label>
            );
          })}
        </fieldset>
        <p className="mt-4 text-muted-foreground text-xs">{t('preferences.language.note')}</p>
      </CardContent>
    </Card>
  );
}
