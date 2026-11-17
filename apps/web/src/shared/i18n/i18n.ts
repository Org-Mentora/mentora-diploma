import { enGB, es as esLocale, type Locale } from 'date-fns/locale';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';
import { es } from './locales/es';

export const LANGUAGES = ['es', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

const STORAGE_KEY = 'mentora.language';
const DEFAULT_LANGUAGE: Language = 'es';

const DATE_LOCALES: Record<Language, Locale> = { es: esLocale, en: enGB };
const INTL_LOCALES: Record<Language, string> = { es: 'es-AR', en: 'en-GB' };

function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

function storedLanguage(): Language | null {
  try {
    const value = globalThis.localStorage?.getItem(STORAGE_KEY);
    return isLanguage(value) ? value : null;
  } catch {
    return null;
  }
}

function browserLanguage(): Language | null {
  const code = globalThis.navigator?.language?.slice(0, 2);
  return isLanguage(code) ? code : null;
}

export const i18n = i18next.createInstance();

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, es: { translation: es } },
  lng: storedLanguage() ?? browserLanguage() ?? DEFAULT_LANGUAGE,
  fallbackLng: 'en',
  supportedLngs: [...LANGUAGES],
  interpolation: { escapeValue: false },
  nsSeparator: false,
  returnNull: false,
  initAsync: false,
});

if (globalThis.document) {
  globalThis.document.documentElement.lang = i18n.language;
}

export function currentLanguage(): Language {
  return isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;
}

export async function changeLanguage(language: Language): Promise<void> {
  await i18n.changeLanguage(language);
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, language);
  } catch {}
  if (globalThis.document) {
    globalThis.document.documentElement.lang = language;
  }
}

export function translate(key: string, options: Record<string, unknown> = {}): string {
  return i18n.t(key, options);
}

export function dateLocale(): Locale {
  return DATE_LOCALES[currentLanguage()];
}

export function intlLocale(): string {
  return INTL_LOCALES[currentLanguage()];
}
