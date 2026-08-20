export const LANGUAGES = {
  EN: 'en',
  AR: 'ar',
} as const;

export type Language = typeof LANGUAGES[keyof typeof LANGUAGES];

export const DEFAULT_LANGUAGE = LANGUAGES.EN;

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  ar: 'العربية',
};

// Determine if text direction should be RTL
export function isRTL(lang: Language): boolean {
  return lang === LANGUAGES.AR;
}

// Get the opposite language
export function getOtherLanguage(lang: Language): Language {
  return lang === LANGUAGES.EN ? LANGUAGES.AR : LANGUAGES.EN;
}
