/**
 * The interface language is shared with the Toguz Korgool game, which keeps it in the
 * 'tk_settings' entry, so switching language anywhere applies everywhere.
 */
import { useCallback, useState } from 'react';
import { translations, type Lang } from '../i18n/translations';

const SETTINGS_KEY = 'tk_settings';

export function readLang(): Lang {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') as { lang?: string };
    if (saved.lang && saved.lang in translations) return saved.lang as Lang;
  } catch {
    // Storage unavailable or corrupted: fall back to the default.
  }
  return 'ru';
}

export function writeLang(lang: Lang) {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...saved, lang }));
  } catch {
    // The choice still applies for this visit.
  }
  document.documentElement.lang = lang;
}

export function useLang(): [Lang, (lang: Lang) => void] {
  const [lang, setLangState] = useState<Lang>(readLang);
  const setLang = useCallback((next: Lang) => {
    writeLang(next);
    setLangState(next);
  }, []);
  return [lang, setLang];
}

export const LANGS: { id: Lang; label: string }[] = [
  { id: 'ky', label: 'Кыр' },
  { id: 'ru', label: 'Рус' },
  { id: 'en', label: 'Eng' },
];
