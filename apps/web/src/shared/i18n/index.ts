import { useTranslation as useI18nextTranslation } from 'react-i18next';
import { changeLanguage, currentLanguage, LANGUAGES, type Language } from './i18n';
import { translateServerMessage } from './serverMessages';

export {
  changeLanguage,
  currentLanguage,
  dateLocale,
  i18n,
  intlLocale,
  LANGUAGES,
  type Language,
  translate,
} from './i18n';

// Adapter
export function useTranslation() {
  const { t, i18n } = useI18nextTranslation();
  return { t, language: (i18n.language as Language) ?? currentLanguage() };
}

export function useLanguage() {
  const { language } = useTranslation();
  return { language, languages: LANGUAGES, changeLanguage };
}

export function localizeServerMessage(message: string): string {
  return translateServerMessage(message, currentLanguage());
}
