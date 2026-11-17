import { type Language, useLanguage, useTranslation } from '@/shared/i18n';

export interface LanguageOption {
  value: Language;
  label: string;
  nativeName: string;
}

export interface LanguageViewModel {
  language: Language;
  options: LanguageOption[];
  change: (language: string) => void;
}

const NATIVE_NAME: Record<Language, string> = { es: 'Español', en: 'English' };

// ViewModel
export function useLanguageViewModel(): LanguageViewModel {
  const { t } = useTranslation();
  const { language, languages, changeLanguage } = useLanguage();
  return {
    language,
    options: languages.map((value) => ({
      value,
      label: t(`preferences.language.${value}`),
      nativeName: NATIVE_NAME[value],
    })),
    change: (next) => {
      const match = languages.find((value) => value === next);
      if (match && match !== language) {
        void changeLanguage(match);
      }
    },
  };
}
